-- Drop existing tables if they exist (in correct order to avoid foreign key constraints)
DROP TABLE IF EXISTS `profile`;
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `role`;

-- Create role table
CREATE TABLE `role` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL UNIQUE,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create user table with role relationship
CREATE TABLE `user` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `roleId` INT NOT NULL,
    `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create profile table (optional - for additional user info)
CREATE TABLE `profile` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `userId` INT NOT NULL UNIQUE,
    `name` VARCHAR(100),
    `email` VARCHAR(100),
    `division` VARCHAR(100),
    `designation` VARCHAR(100),
    `office` VARCHAR(100),
    PRIMARY KEY (`id`),
    FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert roles
INSERT INTO `role` (`name`) VALUES 
('admin'),
('provincial-director');

-- Insert users with hashed password '123456'
-- The password hashes are generated using bcrypt
-- For '123456', the hash is: $2a$10$YourHashHere
-- You'll need to generate these using bcrypt

-- Option 1: Insert users with plain text password (will be hashed on login)
-- But we'll use bcrypt hashed passwords for security

-- For now, insert with temporary hashes (you'll need to update with actual bcrypt hashes)
INSERT INTO `user` (`username`, `password`, `roleId`) VALUES 
('Francis', '$2a$10$3jT4wR5tY6u7i8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j', (SELECT id FROM role WHERE name = 'admin')),
('Jeydeee', '$2a$10$3jT4wR5tY6u7i8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j', (SELECT id FROM role WHERE name = 'provincial-director'));

-- Insert profiles for the users
INSERT INTO `profile` (`userId`, `name`, `email`, `division`, `designation`, `office`) VALUES 
((SELECT id FROM user WHERE username = 'Francis'), 'Francis Dimailig', 'francis@dti.gov.ph', 'Administration', 'System Administrator', 'DTI Main Office'),
((SELECT id FROM user WHERE username = 'Jeydeee'), 'John Dominique Gonzales', 'jeydeee@dti.gov.ph', 'Finance', 'Provincial Director', 'DTI Gasan');