-- Tabelas de Suporte
CREATE TABLE IF NOT EXISTS `tickets` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` int NOT NULL,
  `subject` varchar(255) NOT NULL,
  `status` enum('open', 'closed') DEFAULT 'open' NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS `ticket_messages` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `ticket_id` int NOT NULL,
  `user_id` int NOT NULL,
  `message` text NOT NULL,
  `is_admin` boolean DEFAULT false NOT NULL,
  `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);
