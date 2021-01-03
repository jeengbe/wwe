<?php
// insert/question/set/_
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

$sqlSet = $DB->prepare("SELECT s.ID, s.name FROM sets as s WHERE s.ident = ?");
$sqlSet->bind_param("s", $URL[3]);
$sqlSet->bind_result($sID, $sName);

$sqlQue = $DB->prepare("SELECT q.title FROM questions AS q WHERE q.set = ?");
$sqlQue->bind_param("i", $sID);
$sqlQue->bind_result($qTitle);


$sqlSet->execute();
if ($sqlSet->fetch()) {
  $sqlSet->close();
  $data = [
    "name" => $sName,
    "questions" => []
  ];

  $sqlQue->execute();
  while ($sqlQue->fetch()) {
    $data["questions"][] = [
      "title" => $qTitle
    ];
  }
} else {
  return ["error" => "Invalid set"];
}

return $data;
