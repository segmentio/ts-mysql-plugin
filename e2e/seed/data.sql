--
-- Database.
--

DROP DATABASE IF EXISTS test;
CREATE DATABASE test;
USE test;

--
-- Users.
--

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id VARBINARY(24),
  created TIMESTAMP,
  enabled BOOLEAN,
  friends INT,
);

