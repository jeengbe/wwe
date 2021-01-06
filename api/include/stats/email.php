<?php
// stats/email/_
/** @var \mysqli $DB */

if (!isset($SESSID)) {
  return ["error" => "Not authenticated"];
}

if (!isset($_POST["email"])) {
  return ["error" => "Missing data"];
}

$ts = time();

$sql = $DB->prepare("INSERT INTO emails (session, `set`, email, timestamp) VALUES (?, (SELECT s.ID FROM sets s WHERE s.ident = ?), ?, ?)");
$sql->bind_param("issi", $SESSID, $URL[2], $_POST["email"], $ts);
$sql->execute();