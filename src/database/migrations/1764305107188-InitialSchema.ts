import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1764305107188 implements MigrationInterface {
  name = 'InitialSchema1764305107188';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('unverified', 'inactive', 'active', 'suspended', 'deleted')`,
    );
    await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'user')`);
    await queryRunner.query(`CREATE TYPE "public"."users_work_role_enum" AS ENUM('none', 'investor', 'worker')`);
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "fullName" character varying(200) NOT NULL, "email" character varying(255) NOT NULL, "mobileNumber" character varying(255), "password_hash" character varying(255), "password_updated_at" TIMESTAMP, "reset_password_token" character varying(255), "reset_password_expires_at" TIMESTAMP, "referral_code" character varying(64), "referred_by_user_id" integer, "status" "public"."users_status_enum" NOT NULL DEFAULT 'unverified', "has_children" boolean NOT NULL DEFAULT false, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "work_role" "public"."users_work_role_enum" NOT NULL DEFAULT 'none', "business_done" numeric(18,2) NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "UQ_ee6419219542371563e0592db51" UNIQUE ("reset_password_token"), CONSTRAINT "UQ_ba10055f9ef9690e77cf6445cba" UNIQUE ("referral_code"), CONSTRAINT "CHK_fa27fda17ba9ac35a2f765494a" CHECK ("mobileNumber" IS NULL OR "mobileNumber" ~ '^[0-9+]{7,20}$'), CONSTRAINT "CHK_a269823c7943a239aad943d27a" CHECK ("referral_code" IS NULL OR "referral_code" ~ '^[A-Za-z0-9]{6,64}$'), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email") `);
    await queryRunner.query(`CREATE INDEX "IDX_ba10055f9ef9690e77cf6445cb" ON "users" ("referral_code") `);
    await queryRunner.query(`CREATE INDEX "idx_user_referred_by_user_id" ON "users" ("referred_by_user_id") `);
    await queryRunner.query(`CREATE INDEX "idx_user_referral_code" ON "users" ("referral_code") `);
    await queryRunner.query(`CREATE INDEX "idx_user_email" ON "users" ("email") `);
    await queryRunner.query(
      `CREATE TYPE "public"."wallets_wallet_type_enum" AS ENUM('personal', 'company:investment', 'company:income')`,
    );
    await queryRunner.query(
      `CREATE TABLE "wallets" ("id" SERIAL NOT NULL, "user_id" integer, "balance" numeric(18,2) NOT NULL DEFAULT '0', "wallet_type" "public"."wallets_wallet_type_enum" NOT NULL DEFAULT 'personal', "currency" character varying(10) NOT NULL DEFAULT 'USDT', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_78fcc75fa5c6d3a6cbaff8fee5" CHECK ("currency" ~ '^[A-Z]{3,10}$'), CONSTRAINT "CHK_1c1bf32c2aa1b0f104543f3d6a" CHECK ("balance" >= 0), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_92558c08091598f7a4439586cd" ON "wallets" ("user_id") `);
    await queryRunner.query(`CREATE INDEX "idx_wallet_type" ON "wallets" ("wallet_type") `);
    await queryRunner.query(`CREATE INDEX "idx_wallet_user_id" ON "wallets" ("user_id") `);
    await queryRunner.query(
      `CREATE TABLE "user_closure" ("ancestor_id" integer NOT NULL, "descendant_id" integer NOT NULL, "depth" integer NOT NULL DEFAULT '0', "root_child_id" integer, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_62498a67b134e0d62e79d40e5be" PRIMARY KEY ("ancestor_id", "descendant_id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_uc_descendant" ON "user_closure" ("descendant_id") `);
    await queryRunner.query(
      `CREATE INDEX "idx_uc_ancestor_depth_descendant" ON "user_closure" ("ancestor_id", "depth", "descendant_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_uc_ancestor_rootchild" ON "user_closure" ("ancestor_id", "root_child_id") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_status_enum" AS ENUM('pending', 'approved', 'rejected')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."transactions_type_enum" AS ENUM('p2p', 'c2c', 'add:company', 'add:personal', 'income:bonaza', 'income:passive', 'income:bot', 'income:trading', 'income:appraisal', 'purchase:package', 'withdraw:company', 'withdraw:personal')`,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" SERIAL NOT NULL, "from_wallet_id" integer, "to_wallet_id" integer, "amount" numeric(18,2) NOT NULL, "initiated_by" integer NOT NULL, "description" character varying(1000), "status" "public"."transactions_status_enum" NOT NULL DEFAULT 'pending', "status_updated_at" TIMESTAMP, "status_updated_by" integer, "type" "public"."transactions_type_enum" NOT NULL, "entity_id" integer, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_9198d226beafef9bbe5e6cd194" CHECK ("from_wallet_id" IS NULL OR "to_wallet_id" IS NULL OR "from_wallet_id" <> "to_wallet_id"), CONSTRAINT "CHK_62aa055cd540df8774499ba22b" CHECK ("amount" > 0), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_c337cc8fd8b43b3e8414f6464e" ON "transactions" ("from_wallet_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_0ead82990d0099eecec1fa10a2" ON "transactions" ("to_wallet_id") `);
    await queryRunner.query(`CREATE INDEX "IDX_fccb615e34cc3d13821354bf06" ON "transactions" ("initiated_by") `);
    await queryRunner.query(`CREATE INDEX "IDX_033934753c087ec1ad01a66ec3" ON "transactions" ("status_updated_by") `);
    await queryRunner.query(`CREATE INDEX "IDX_2d5fa024a84dceb158b2b95f34" ON "transactions" ("type") `);
    await queryRunner.query(`CREATE INDEX "IDX_b7de2cfe3d235448251d077a64" ON "transactions" ("entity_id") `);
    await queryRunner.query(
      `CREATE INDEX "idx_transaction_status_fromwalletid" ON "transactions" ("status", "from_wallet_id") `,
    );
    await queryRunner.query(`CREATE INDEX "idx_transaction_id_status" ON "transactions" ("id", "status") `);
    await queryRunner.query(`CREATE TYPE "public"."packages_type_enum" AS ENUM('monthly', 'one-time')`);
    await queryRunner.query(
      `CREATE TABLE "packages" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "min_price" numeric(18,2) NOT NULL DEFAULT '100', "max_price" numeric(18,2) NOT NULL DEFAULT '20000', "months" integer NOT NULL, "type" "public"."packages_type_enum" NOT NULL, "features" text NOT NULL, "return_percentage" numeric(5,2), "return_capital" numeric(5,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_020801f620e21f943ead9311c98" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."bot_activations_status_enum" AS ENUM('active', 'expired', 'consumed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "bot_activations" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "wallet_id" integer NOT NULL, "status" "public"."bot_activations_status_enum" NOT NULL DEFAULT 'active', "income_received" numeric(18,2) NOT NULL DEFAULT '0', "max_income" numeric(18,2) NOT NULL DEFAULT '0', "notes" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d647d28208d1a33e0967b77f77a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_bot_activations_status" ON "bot_activations" ("status") `);
    await queryRunner.query(`CREATE INDEX "idx_bot_activations_wallet_id" ON "bot_activations" ("wallet_id") `);
    await queryRunner.query(`CREATE INDEX "idx_bot_activations_user_id" ON "bot_activations" ("user_id") `);
    await queryRunner.query(`CREATE TYPE "public"."user_packages_status_enum" AS ENUM('in-progress', 'completed')`);
    await queryRunner.query(
      `CREATE TABLE "user_packages" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "package_id" integer NOT NULL, "bot_id" integer NOT NULL, "investment_amount" numeric(18,2) NOT NULL, "purchase_date" TIMESTAMP NOT NULL DEFAULT now(), "status" "public"."user_packages_status_enum" NOT NULL DEFAULT 'in-progress', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_77153c9b456a6fd5c5f48501ccb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_user_packages_bot_id" ON "user_packages" ("bot_id") `);
    await queryRunner.query(`CREATE INDEX "idx_user_packages_user_id" ON "user_packages" ("user_id") `);
    await queryRunner.query(
      `CREATE TYPE "public"."otps_purpose_enum" AS ENUM('login', 'signup', 'forgot-password', 'verify')`,
    );
    await queryRunner.query(
      `CREATE TABLE "otps" ("id" SERIAL NOT NULL, "otp" character varying(10) NOT NULL, "expires_at" TIMESTAMP NOT NULL, "user_email" character varying(255) NOT NULL, "purpose" "public"."otps_purpose_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_91fef5ed60605b854a2115d2410" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_bd65700a251465579f9a84d76c" ON "otps" ("expires_at") `);
    await queryRunner.query(`CREATE INDEX "IDX_aab374dd5000342dd22dc3b415" ON "otps" ("user_email") `);
    await queryRunner.query(`CREATE INDEX "IDX_d30b4300db16a8519937514e5f" ON "otps" ("purpose") `);
    await queryRunner.query(`CREATE INDEX "idx_otp_email_purpose" ON "otps" ("user_email", "purpose") `);
    await queryRunner.query(`CREATE INDEX "idx_otp_user_email" ON "otps" ("user_email") `);
    await queryRunner.query(
      `CREATE TABLE "levels" ("id" SERIAL NOT NULL, "title" character varying(255) NOT NULL, "hierarchy" integer NOT NULL, "appraisal_bonus" numeric(10,2) NOT NULL DEFAULT '0', "passive_income_percentage" numeric(5,2) NOT NULL, "conditions" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_05f8dd8f715793c64d49e3f1901" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "IDX_207de9f10aa9abc774adaff636" ON "levels" ("hierarchy") `);
    await queryRunner.query(
      `CREATE TABLE "user_levels" ("id" SERIAL NOT NULL, "level_id" integer NOT NULL, "user_id" integer NOT NULL, "start_date" TIMESTAMP NOT NULL DEFAULT now(), "end_date" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_27517134ee9bccf5427621978ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "idx_user_levels_user_level" ON "user_levels" ("user_id", "level_id") `);
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_c4de8784831eab14aace7c26e65" FOREIGN KEY ("referred_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_92558c08091598f7a4439586cda" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_c337cc8fd8b43b3e8414f6464ec" FOREIGN KEY ("from_wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_0ead82990d0099eecec1fa10a29" FOREIGN KEY ("to_wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_fccb615e34cc3d13821354bf066" FOREIGN KEY ("initiated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_033934753c087ec1ad01a66ec37" FOREIGN KEY ("status_updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bot_activations" ADD CONSTRAINT "FK_7f9afda8b02588e602aa5291268" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bot_activations" ADD CONSTRAINT "FK_22e28baea8947b40eceb6eccc2c" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_packages" ADD CONSTRAINT "FK_9fbbdc1c0c48a5434b2582df8a6" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_packages" ADD CONSTRAINT "FK_22ad76c5549e4c1c31da306c993" FOREIGN KEY ("package_id") REFERENCES "packages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_packages" ADD CONSTRAINT "FK_1f2efca9532220f943b9bf3ed79" FOREIGN KEY ("bot_id") REFERENCES "bot_activations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_levels" ADD CONSTRAINT "FK_b109156dc0f437da65902e63d70" FOREIGN KEY ("level_id") REFERENCES "levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_levels" ADD CONSTRAINT "FK_e715664e276e41f2f18bc99421f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user_levels" DROP CONSTRAINT "FK_e715664e276e41f2f18bc99421f"`);
    await queryRunner.query(`ALTER TABLE "user_levels" DROP CONSTRAINT "FK_b109156dc0f437da65902e63d70"`);
    await queryRunner.query(`ALTER TABLE "user_packages" DROP CONSTRAINT "FK_1f2efca9532220f943b9bf3ed79"`);
    await queryRunner.query(`ALTER TABLE "user_packages" DROP CONSTRAINT "FK_22ad76c5549e4c1c31da306c993"`);
    await queryRunner.query(`ALTER TABLE "user_packages" DROP CONSTRAINT "FK_9fbbdc1c0c48a5434b2582df8a6"`);
    await queryRunner.query(`ALTER TABLE "bot_activations" DROP CONSTRAINT "FK_22e28baea8947b40eceb6eccc2c"`);
    await queryRunner.query(`ALTER TABLE "bot_activations" DROP CONSTRAINT "FK_7f9afda8b02588e602aa5291268"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_033934753c087ec1ad01a66ec37"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_fccb615e34cc3d13821354bf066"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_0ead82990d0099eecec1fa10a29"`);
    await queryRunner.query(`ALTER TABLE "transactions" DROP CONSTRAINT "FK_c337cc8fd8b43b3e8414f6464ec"`);
    await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_92558c08091598f7a4439586cda"`);
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_c4de8784831eab14aace7c26e65"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_levels_user_level"`);
    await queryRunner.query(`DROP TABLE "user_levels"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_207de9f10aa9abc774adaff636"`);
    await queryRunner.query(`DROP TABLE "levels"`);
    await queryRunner.query(`DROP INDEX "public"."idx_otp_user_email"`);
    await queryRunner.query(`DROP INDEX "public"."idx_otp_email_purpose"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d30b4300db16a8519937514e5f"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_aab374dd5000342dd22dc3b415"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_bd65700a251465579f9a84d76c"`);
    await queryRunner.query(`DROP TABLE "otps"`);
    await queryRunner.query(`DROP TYPE "public"."otps_purpose_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_packages_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_packages_bot_id"`);
    await queryRunner.query(`DROP TABLE "user_packages"`);
    await queryRunner.query(`DROP TYPE "public"."user_packages_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_bot_activations_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_bot_activations_wallet_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_bot_activations_status"`);
    await queryRunner.query(`DROP TABLE "bot_activations"`);
    await queryRunner.query(`DROP TYPE "public"."bot_activations_status_enum"`);
    await queryRunner.query(`DROP TABLE "packages"`);
    await queryRunner.query(`DROP TYPE "public"."packages_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_transaction_id_status"`);
    await queryRunner.query(`DROP INDEX "public"."idx_transaction_status_fromwalletid"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_b7de2cfe3d235448251d077a64"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_2d5fa024a84dceb158b2b95f34"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_033934753c087ec1ad01a66ec3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_fccb615e34cc3d13821354bf06"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0ead82990d0099eecec1fa10a2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c337cc8fd8b43b3e8414f6464e"`);
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."transactions_status_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_uc_ancestor_rootchild"`);
    await queryRunner.query(`DROP INDEX "public"."idx_uc_ancestor_depth_descendant"`);
    await queryRunner.query(`DROP INDEX "public"."idx_uc_descendant"`);
    await queryRunner.query(`DROP TABLE "user_closure"`);
    await queryRunner.query(`DROP INDEX "public"."idx_wallet_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."idx_wallet_type"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_92558c08091598f7a4439586cd"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(`DROP TYPE "public"."wallets_wallet_type_enum"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_email"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_referral_code"`);
    await queryRunner.query(`DROP INDEX "public"."idx_user_referred_by_user_id"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_ba10055f9ef9690e77cf6445cb"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_work_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
  }
}
