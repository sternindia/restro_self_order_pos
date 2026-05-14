<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "restaurant_pos";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("DB Connection Failed");
}
?>
