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
$sql = $DB->prepare("SELECT s.ID FROM sets s WHERE s.ident = ?");
$sql->bind_param("s", $URL[2]);
$sql->execute();
if (!$sql->fetch()) {
  return ["error" => "Invalid set"];
}
$sql->close();

$sql = $DB->prepare("SELECT q.id, q.ident, q.title, q.description, q.min, q.max, q.exactly FROM questions q JOIN sets s ON q.set = s.ID WHERE s.ident = ? AND q.id NOT IN (SELECT q.id FROM questions q JOIN options o JOIN sessions s JOIN answers a ON a.option = o.id AND o.question = q.id AND a.session = s.id WHERE s.sessid = ?)");
$sql->bind_result($id, $ident, $title, $description, $min, $max, $exactly);
$sql->bind_param("ss", $URL[2], $sid);
$sql->execute();
$sql->store_result();
while ($sql->fetch()) {
  $sqlOpt = $DB->prepare("SELECT o.ident, o.name FROM options o WHERE o.question = ?");
  $sqlOpt->bind_result($oIdent, $oName);
  $sqlOpt->bind_param("i", $id);
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
      "name" => $oName
    ];
  }
  $data[] = $q;
}

return $data;
