-- DropForeignKey
ALTER TABLE `ai_provider_events` DROP FOREIGN KEY `ai_provider_events_created_by_fkey`;

-- DropForeignKey
ALTER TABLE `ai_provider_events` DROP FOREIGN KEY `ai_provider_events_provider_id_fkey`;

-- DropForeignKey
ALTER TABLE `ai_system_prompts` DROP FOREIGN KEY `ai_system_prompts_created_by_fkey`;

-- DropTable
DROP TABLE `ai_agent_logs`;

-- DropTable
DROP TABLE `ai_api_keys`;

-- DropTable
DROP TABLE `ai_models`;

-- DropTable
DROP TABLE `ai_provider_events`;

-- DropTable
DROP TABLE `ai_providers`;

-- DropTable
DROP TABLE `ai_system_prompts`;
