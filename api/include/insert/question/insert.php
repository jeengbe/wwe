<?php
// insert/question/set/_
/** @var \mysqli $DB */

if (!isset($SESSID)) {
  return ["error" => "Not authenticated"];
}

if (!isset($_POST["question"])) {
  return ["error" => "Missing data"];
}

$ts = time();

$sql = $DB->prepare("SELECT s.ID FROM sets AS s WHERE s.ident = ?");
$sql->bind_param("s", $URL[3]);
$sql->bind_result($sID);
$sql->execute();
if(!$sql->fetch()) {
  return ["error" => "Invalid set"];
}
$sql->close();

$sql = $DB->prepare("INSERT INTO questions (title, ident, `set`) VALUES (?, MD5(RAND()), ?)");
$sql->bind_param("si", $_POST["question"], $sID);
$sql->execute();
$qID = $DB->insert_id;
$sql->close();

$sql = $DB->prepare("INSERT INTO questioninserters (question, sessid, timestamp) VALUES (?, ?, ?)");
$sql->bind_param("iii", $qID, $SESSID, $ts);
$sql->execute();