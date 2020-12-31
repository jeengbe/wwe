<?php
/** @var \mysqli $DB */

if (!isset($SESSID)) {
  return ["error" => "Not authenticated"];
}

if (!isset($_POST["idents"])) {
  return ["error" => "Missing data"];
}
if (($options = json_decode($_POST["idents"], true)) === null) {
  return ["error" => "Invalid data"];
}

$ts = time();



$sql = $DB->prepare("SELECT q.min, q.max, q.exactly FROM questions as q WHERE q.ident = ?");
$sql->bind_result($min, $max, $exactly);
$sql->bind_param("s", $URL[1]);
$sql->execute();
if ($sql->fetch()) {
  $sql->close();
  $count = count($options);
  if ($exactly !== null) {
    if ($count !== intval($exactly)) {
      return ["error" => "Invalid count"];
    }
  }
  if($min !== null) {
    if($count < intval($min)) {
      return ["error" => "Invalid count"];
    }
  } else {
    if($count < 1) {
      return ["error" => "Invalid count"];
    }
  }
  if($max !== null) {
    if($count > intval($max)) {
      return ["error" => "Invalid count"];
    }
  }
  // => Count okay

  foreach($options as $opt) {
    $sql = $DB->prepare("INSERT INTO answers (session, option, timestamp) VALUES (?, (SELECT o.ID FROM options AS o WHERE o.ident = ?), ?)");
    $sql->bind_param("isi", $SESSID, $opt, $ts);
    $sql->execute();
    $sql->close();
  }
  return ["success" => true];
} else {
  return ["error" => "wrongIdent"];
}

return $data;
