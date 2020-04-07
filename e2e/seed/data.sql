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
  id      VARBINARY(24) NOT NULL,
  name    VARBINARY(24),
  email   VARBINARY(24),
  created TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  enabled BOOLEAN DEFAULT TRUE NOT NULL,
  friends INT NOT NULL,
  project INT,

  PRIMARY KEY(id),
  INDEX(created),
  INDEX(enabled),
  INDEX(friends),
  INDEX(project)
);
