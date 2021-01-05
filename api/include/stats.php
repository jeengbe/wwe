<?php
// stats/_
/** @var \mysqli $DB */
define("MIN_ANS", 10);

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
  $sql = $DB->prepare("SELECT ID FROM sessions s WHERE s.sessid = ? ORDER BY ID DESC");
  $sql->bind_result($SESSID);
  $sql->bind_param("s", $sid);
  $sql->execute();
  $sql->fetch();
  $sql->close();
}

$ts = time();

// Check set ident
$sql = $DB->prepare("SELECT s.id, s.name FROM sets s WHERE s.ident = ?");
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
$data["minAns"] = MIN_ANS;
// Set
$data["set"] = [
  "name" => $sName
];

// Questions
$data["questions"] = [];

// Get all questions
$sqlQue = $DB->prepare("SELECT (SELECT COUNT(DISTINCT a.session) FROM `answers` a JOIN options o ON a.option = o.ID WHERE o.question = q.ID), (SELECT COUNT(y.ID) FROM answers y JOIN options o ON y.option = o.ID WHERE y.status = 1 AND o.question = q.ID) - (SELECT COUNT(n.ID) FROM answers n JOIN options o ON n.option = o.ID WHERE n.status = 0 AND o.question = q.ID), q.ID, q.title, q.description, q.min, q.max, q.exactly, q.group FROM questions q WHERE q.set = ?");
$sqlQue->bind_param("i", $sID);
$sqlQue->bind_result($qAns, $qOptNr, $qID, $qTitle, $qDescription, $qMin, $qMax, $qExactly, $qGroup);

// Count answers per question ```$qID```
$sqlAns = $DB->prepare("SELECT * FROM (SELECT o.name, (SELECT COUNT(y.ID) FROM answers y WHERE y.status = 1 AND y.option = o.ID) - (SELECT COUNT(n.ID) FROM answers n WHERE n.status = 0 AND n.option = o.ID) c FROM options o WHERE o.question = ?) q WHERE q.c > 0");
$sqlAns->bind_param("i", $qID);
$sqlAns->bind_result($aLabel, $aNr);

// Group answers per question ```$qID``` by answerer ```answers.session```
$sqlAnsGrp = $DB->prepare("SELECT a, COUNT(a) FROM (SELECT GROUP_CONCAT(DISTINCT o.name SEPARATOR ', ') a FROM answers a JOIN options o ON a.option = o.ID WHERE (SELECT o.question FROM options o WHERE o.ID = a.option) = ? AND (SELECT COUNT(y.ID) FROM answers y WHERE y.status = 1 AND y.option = a.option AND y.session = a.session) - (SELECT COUNT(n.ID) FROM answers n WHERE n.status = 0 AND n.option = a.option AND n.session = a.session) > 0 GROUP BY a.session) a GROUP BY a");
$sqlAnsGrp->bind_param("i", $qID);
$sqlAnsGrp->bind_result($aLabel, $aNr);

$sqlQue->execute();
$sqlQue->store_result();
while ($sqlQue->fetch()) {
  $q = [
    "title" => $qTitle,
    "answers" => $qAns,
    "optNr" => $qOptNr,
    "group" => $qGroup === 1,
    "options" => $qGroup === 1 ? ["group" => [], "standard" => []] : []
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
    if ($qGroup === 1) {
      $sqlAnsGrp->execute();
      $sqlAnsGrp->store_result();
      while ($sqlAnsGrp->fetch()) {
        $q["options"]["group"][] = [
          "label" => $aLabel,
          "count" => $aNr
        ];
      }

      $sqlAns->execute();
      $sqlAns->store_result();
      while ($sqlAns->fetch()) {
        $q["options"]["standard"][] = [
          "label" => $aLabel,
          "count" => $aNr
        ];
      }
    } else {
      $sqlAns->execute();
      $sqlAns->store_result();
      while ($sqlAns->fetch()) {
        $q["options"][] = [
          "label" => $aLabel,
          "count" => $aNr
        ];
      }
    }
  } else {
    $q["options"] = "not enough data";
  }
  $data["questions"][] = $q;
}

return $data;
