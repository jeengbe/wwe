<?php
// set/load/_
/** @var \mysqli $DB */

// Register session
$cip = getClientIP();
$ts = time();
$ua = $_SERVER['HTTP_USER_AGENT'];
$sql = $DB->prepare("INSERT INTO sessions (sessid, ip, timestamp, useragent) VALUES (?, ?, ?, ?)");
$sql->bind_param("ssis", $SID, $cip, $ts, $ua);
$sql->execute();
$sql->close();

// Check set ident
$sql = $DB->prepare("SELECT s.name, (SELECT COUNT(n.question) FROM nexts n JOIN sessions s ON n.session = s.ID WHERE s.sessid = ?), (SELECT COUNT(q.ID) FROM questions q WHERE q.set = s.ID) FROM sets s WHERE s.ident = ?");
$sql->bind_param("ss", $SID, $URL[2]);
$sql->bind_result($sName, $startIndex, $realNrQuestions);
$sql->execute();
if (!$sql->fetch()) {
  return ["error" => "Invalid set"];
}
$sql->close();

$data = [
  "name" => $sName,
  "startQuestionIndex" => $startIndex,
  "realNrQuestions" => $realNrQuestions,
  "questions" => []
];

$sql = $DB->prepare("SELECT q.id, q.ident, q.title, q.description, q.min, q.max, q.exactly FROM questions q JOIN sets s ON q.set = s.ID WHERE s.ident = ? AND q.id NOT IN (SELECT n.question FROM nexts n JOIN sessions s ON n.session = s.ID WHERE s.sessid = ?)");
$sql->bind_result($id, $ident, $title, $description, $min, $max, $exactly);
$sql->bind_param("ss", $URL[2], $SID);

$sqlOpt = $DB->prepare("SELECT o.ident, (SELECT COUNT(a.ID) % 2 FROM answers a WHERE a.session IN (SELECT s.ID FROM sessions s WHERE s.sessid = ?) AND a.option = o.ID), o.name FROM options o WHERE o.question = ?");
$sqlOpt->bind_result($oIdent, $oSelected, $oName);
$sqlOpt->bind_param("si", $SID, $id);

$sql->execute();
$sql->store_result();
while ($sql->fetch()) {
  $sqlOpt->execute();
  $q = [
    "ident" => $ident,
    "title" => $title,
    "options" => []
  ];
  if ($description !== null) {
    $q["description"] = $description;
  }

  if ($min !== null || $max !== null) {
    if ($min !== null)
      $q["min"] = $min;
    if ($max !== null)
      $q["max"] = $max;
  } else if ($exactly !== null)
    $q["exactly"] = $exactly;

  while ($sqlOpt->fetch()) {
    $q["options"][] = [
      "ident" => $oIdent,
      "selected" => $oSelected === 1,
      "name" => $oName
    ];
  }
  $data["questions"][] = $q;
}

return $data;
