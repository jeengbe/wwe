<?php
// questions/list/_
/** @var \mysqli $DB */

// Register session
$sid = session_id();
$cip = getClientIP();
$ts = time();
$ua = $_SERVER['HTTP_USER_AGENT'];
$sql = $DB->prepare("INSERT INTO sessions (sessid, ip, timestamp, useragent) VALUES (?, ?, ?, ?)");
$sql->bind_param("ssis", $sid, $cip, $ts, $ua);
$sql->execute();
$sql->close();

// Check set ident
$sql = $DB->prepare("SELECT s.id FROM sets as s WHERE s.ident = ?");
$sql->bind_param("s", $URL[2]);
$sql->execute();
if(!$sql->fetch()) {
  return [
    "error" => "Invalid set"
  ];
}
$sql->close();

$sql = $DB->prepare("SELECT q.id, q.ident, q.title, q.description, q.min, q.max, q.exactly FROM questions as q JOIN sets as s ON q.set = s.ID WHERE s.ident = ? AND q.id NOT IN (SELECT q.id FROM questions as q JOIN options as o JOIN sessions AS s JOIN answers AS a ON a.option = o.id AND o.question = q.id AND a.session = s.id WHERE s.sessid = ?)");
$sql->bind_result($id, $ident, $title, $description, $min, $max, $exactly);
$sql->bind_param("ss", $URL[2], $sid);
$sql->execute();
$sql->store_result();
while($sql->fetch()) {
  $sqlOpt = $DB->prepare("SELECT o.ident, o.name FROM options as o WHERE o.question = ?");
  $sqlOpt->bind_result($oIdent, $oName);
  $sqlOpt->bind_param("i", $id);
  $sqlOpt->execute();
  $q = [
    "ident" => $ident,
    "title" => $title,
    "description" => $description,
    "options" => []
  ];
  if($min !== null || $max !== null) {
    if($min !== null)
      $q["min"] = $min;
    if($max !== null)
      $q["max"] = $max;
  } else if($exactly !== null)
    $q["exactly"] = $exactly;

  while($sqlOpt->fetch()) {
    $q["options"][] = [
      "ident" => $oIdent,
      "name" => $oName
    ];
  }
  $data[] = $q;
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

return $data;