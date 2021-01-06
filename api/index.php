<?php
header("Content-Type: application/json");

$DB = new mysqli("localhost", "wwe", "", "wwe");
$URL = explode("/", $_GET["api"] ?? "");


if (isset($_COOKIE["PHPSESSID"])) {
  $SID = $_COOKIE["PHPSESSID"];
  setcookie("PHPSESSID", "", 0, "/");
  setcookie("sessid", $SID, time() + 60 * 60 * 24 * 365, "/");
} else if (isset($_COOKIE["sessid"])) {
  $SID = $_COOKIE["sessid"];
} else {
  $sqlCheck = $DB->prepare("SELECT s.ID FROM sessions s WHERE s.sessid = ?");
  $sqlCheck->bind_param("s", $SID);
  $SID;
  do {
    $SID = md5(random_bytes(32));
    $sqlCheck->execute();
  } while($sqlCheck->fetch());
  setcookie("sessid", $SID, time() + 60 * 60 * 24 * 365, "/");
}

$sql = $DB->prepare("SELECT ID FROM sessions as s WHERE s.sessid = ? ORDER BY ID DESC");
$sql->bind_result($SESSID);
$sql->bind_param("s", $SID);
$sql->execute();
$sql->fetch();
$sql->close();

$inc = null;

$incs = [
  "set/load/_" => "questions/list.php",
  "questions/option/_/_" => "questions/option.php",
  "questions/next/_" => "questions/next.php",
  "stats/email/_" => "stats/email.php",
  "stats/_" => "stats/stats.php",
  "insert/question/set/_" => "insert/question/set.php",
  "insert/question/insert/_" => "insert/question/insert.php",
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
  (function ($inc) use (&$DB, &$URL, &$SID, &$SESSID) {
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
