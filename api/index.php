<?php
header("Access-Control-Allow-Origin: *");
session_start();
$URL = explode("/", $_GET["api"] ?? "");
$DB = new mysqli("localhost", "root", "", "wwe");

$sid = session_id();
$sql = $DB->prepare("SELECT ID FROM sessions as s WHERE s.sessid = ? ORDER BY ID DESC");
$sql->bind_result($SESSID);
$sql->bind_param("s", $sid);
$sql->execute();
$sql->fetch();
$sql->close();

$inc = null;
if (count($URL) > 0) {
  switch ($URL[0]) {
    case "questions":
      if (count($URL) === 2) {
        $inc = "questions/list.php";
      }
      break;
    case "question":
      if(count($URL) === 3) {
        $inc = "questions/options.php";
      }
      break;
  }
}

if ($inc !== null) {
  (function ($inc) use (&$DB, &$URL, &$SESSID) {
    /** @var string $inc */
    $data = [];
    $data = include __DIR__ . "/include/$inc";
    if (!is_array($data)) {
      $data = [];
    }
    echo json_encode($data);
  })($inc);
} else {
  echo json_encode(["error" => "Unknown route"]);
}