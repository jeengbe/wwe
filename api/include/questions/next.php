<?php
// questions/next/_
/** @var \mysqli $DB */

if (!isset($SESSID)) {
  return ["error" => "Not authenticated"];
}

$ts = time();

$sql = $DB->prepare("SELECT q.ID FROM questions q WHERE q.ident = ?");
$sql->bind_result($qID);
$sql->bind_param("s", $URL[2]);
$sql->execute();
if ($sql->fetch()) {
  $sql->close();

  $sql = $DB->prepare("INSERT INTO nexts (session, question, timestamp) VALUES (?, ?, ?)");
  $sql->bind_param("iii", $SESSID, $qID, $ts);
  $sql->execute();
  $sql->close();
  return ["success" => true];
} else {
  return ["error" => "Invalid question"];
}
