import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrdersTable1741300000000 implements MigrationInterface {
  name = 'CreateOrdersTable1741300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."orders_status_enum" AS ENUM('new', 'in_progress', 'completed', 'cancelled')
    `);

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "order_number" character varying(50) NOT NULL,
        "status" "public"."orders_status_enum" NOT NULL DEFAULT 'new',
        "title" character varying(200) NOT NULL,
        "description" text,
        "client_id" uuid NOT NULL,
        "order_date" date NOT NULL,
        "delivery_date" date,
        "currency" character varying(3) NOT NULL DEFAULT 'PLN',
        "items" jsonb NOT NULL DEFAULT '[]',
        "net_total" numeric(12,2) NOT NULL DEFAULT '0',
        "vat_total" numeric(12,2) NOT NULL DEFAULT '0',
        "gross_total" numeric(12,2) NOT NULL DEFAULT '0',
        "notes" text,
        "created_by" uuid NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_orders_order_number" UNIQUE ("order_number"),
        CONSTRAINT "PK_orders" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "orders"
        ADD CONSTRAINT "FK_orders_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT,
        ADD CONSTRAINT "FK_orders_creator" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT
    `);

    await queryRunner.query(`CREATE INDEX "IDX_orders_client_id" ON "orders" ("client_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_status" ON "orders" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_orders_order_date" ON "orders" ("order_date")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_orders_order_date"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_status"`);
    await queryRunner.query(`DROP INDEX "IDX_orders_client_id"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_creator"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_orders_client"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
  }
}
