<?php
// stats/_
/** @var \mysqli $DB */

if (!isset($SESSID)) {
  // Register session
  $sid = session_id();
  $cip = getClientIP();
  $ts = time();
  $ua = $_SERVER['HTTP_USER_AGENT'];
  $sql = $DB->prepare("INSERT INTO sessions (sessid, ip, timestamp, useragent) VALUES (?, ?, ?, ?)");
  $sql->bind_param("ssis", $sid, $cip, $ts, $ua);
  $sql->execute();
  $sql->close();
  $sql = $DB->prepare("SELECT ID FROM sessions as s WHERE s.sessid = ? ORDER BY ID DESC");
  $sql->bind_result($SESSID);
  $sql->bind_param("s", $sid);
  $sql->execute();
  $sql->fetch();
  $sql->close();
}

$ts = time();

// Check set ident
$sql = $DB->prepare("SELECT s.id, s.name FROM sets as s WHERE s.ident = ?");
$sql->bind_result($sID, $sName);
$sql->bind_param("s", $URL[1]);
$sql->execute();
if (!$sql->fetch()) {
  return ["error" => "Invalid set"];
}
$sql->close();

// Insert stats view
$sql = $DB->prepare("INSERT INTO stats (`session`, `set`, `timestamp`) VALUES (?, ?, ?)");
$sql->bind_param("iii", $SESSID, $sID, $ts);
$sql->execute();

// Prepare stats

define("MIN_ANS", 10);
$data["minAns"] = MIN_ANS;
// Set
$data["set"] = [
  "name" => $sName
];

// Questions
$data["questions"] = [];
// Get all questions
$sqlQue = $DB->prepare("SELECT (SELECT COUNT(DISTINCT a.session) FROM `answers` as a JOIN options as o ON a.option = o.ID WHERE o.question = q.ID), q.ID, q.title, q.description, q.min, q.max, q.exactly FROM questions AS q WHERE q.set = ?");
$sqlQue->bind_param("i", $sID);
$sqlQue->bind_result($qAns, $qID, $qTitle, $qDescription, $qMin, $qMax, $qExactly);
// Get all options per question
$sqlOpt = $DB->prepare("SELECT o.ID, o.name FROM options as o WHERE o.question = ?");
$sqlOpt->bind_param("i", $qID);
$sqlOpt->bind_result($oID, $oName);
// Count answers per option per question
$sqlAns = $DB->prepare("SELECT COUNT(y.ID)-COUNT(n.ID) FROM answers AS y LEFT JOIN answers AS n ON y.option = n.option AND n.status = 0 WHERE y.status = 1 AND y.option = ?");
$sqlAns->bind_param("i", $oID);
$sqlAns->bind_result($aNr);


$sqlQue->execute();
$sqlQue->store_result();
while ($sqlQue->fetch()) {
  $q = [
    "title" => $qTitle,
    "answers" => $qAns,
    "options" => []
  ];
  if ($qDescription !== null) {
    $q["description"] = $qDescription;
  }

  if ($qMin !== null || $qMax !== null) {
    if ($qMin !== null)
      $q["min"] = $qMin;
    if ($qMax !== null)
      $q["max"] = $qMax;
  } else if ($qExactly !== null)
    $q["exactly"] = $qExactly;

  if ($qAns >= MIN_ANS) {
    $sqlOpt->execute();
    $sqlOpt->store_result();
    while ($sqlOpt->fetch()) {
      $sqlAns->execute();
      $sqlAns->store_result();
      $sqlAns->fetch();
      $q["options"][] = [
        "option" => [
          "name" => $oName
        ],
        "count" => $aNr
      ];
    }
  } else {
    $q["options"] = "not enough data";
  }
  $data["questions"][] = $q;
}

return $data;
