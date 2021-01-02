<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
ini_set('session.gc_maxlifetime', 60 * 60 * 24 * 365);
session_set_cookie_params(60 * 60 * 24 * 365);
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

$incs = [
  "questions/list/_" => "questions/list.php",
  "questions/option/_/_" => "questions/option.php",
  "questions/next/_" => "questions/next.php",
  "stats/_" => "stats.php",
  "insert" => "insert.php"
];

foreach($incs as $incp => $incf) {
  $incpa = explode("/", $incp);
  foreach($incpa as $i => $incpas) {
    if(!isset($URL[$i]) || ($incpas !== "_" && $URL[$i] !== $incpas)) {
      continue 2;
    }
  }
  $inc = $incf;
  break;
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


function getClientIP(): string {
  $keys = array('HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'HTTP_X_FORWARDED', 'HTTP_FORWARDED_FOR', 'HTTP_FORWARDED', 'REMOTE_ADDR');
  foreach ($keys as $k) {
    if (!empty($_SERVER[$k]) && filter_var($_SERVER[$k], FILTER_VALIDATE_IP)) {
      return $_SERVER[$k];
    }
  }
  return "UNKNOWN";
}
