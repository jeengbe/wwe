<?php
// questions/option/_/_
/** @var \mysqli $DB */

if (!isset($SESSID)) {
  return ["error" => "Not authenticated"];
}

if (!isset($_POST["status"])) {
  return ["error" => "Missing data"];
}
if (!in_array($_POST["status"], ["1", "0"])) {
  return ["error" => "Invalid data"];
}

$sql = $DB->prepare("SELECT o.ID FROM options o WHERE o.ident = ?");
$sql->bind_param("s", $URL[3]);
$sql->execute();
if(!$sql->fetch()) {
  return ["error" => "Invalid option"];
}
$sql->close();

$ts = time();

$sql = $DB->prepare("SELECT q.ID FROM questions q WHERE q.ident = ?");
$sql->bind_param("s", $URL[2]);
$sql->execute();
if ($sql->fetch()) {
  $sql->close();

  $s = intval($_POST["status"]);
  $sql = $DB->prepare("INSERT INTO answers (session, option, status, timestamp) VALUES (?, (SELECT o.ID FROM options o WHERE o.ident = ?), ?, ?)");
  $sql->bind_param("isii", $SESSID, $URL[3], $s, $ts);
  $sql->execute();
  $sql->close();
  return ["success" => true];
} else {
  return ["error" => "Invalid question"];
}
