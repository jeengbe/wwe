<?php

$sql = $DB->prepare("INSERT INTO questions (title, ident, `set`) VALUES (?, MD5(RAND()), 1)");
$sql->bind_param("s", $_POST["q"]);
$sql->execute();