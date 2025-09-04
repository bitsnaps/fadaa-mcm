import { describe, it, expect, beforeEach, afterAll } from "vitest";
const models = require("../../models");

describe("Office Model", () => {
  beforeEach(async () => {
    await models.sequelize.sync({ force: true });
    await models.Branch.create({ id: 1, name: "Main Branch" });
  });

  afterAll(async () => {
    await models.sequelize.close();
  });

  it("should have a default status of 'Available'", async () => {
    const office = await models.Office.create({
      name: "Test Office",
      branch_id: 1,
      type: "Private",
    });
    expect(office.status).toBe("Available");
  });

  it("should not allow a null status", async () => {
    await expect(
      models.Office.create({
        name: "Test Office",
        branch_id: 1,
        type: "Private",
        status: null,
      })
    ).rejects.toThrow();
  });

  it("should only allow valid status values", async () => {
    // **IMPORTANT** Assuming we do have only these status at the moment
    const validStatuses = ["Available", "Occupied", "Maintenance", "Unavailable"];
    for (const status of validStatuses) {
      const office = await models.Office.create({
        name: `Office ${status}`,
        branch_id: 1,
        type: "Private",
        status: status,
      });
      expect(office.status).toBe(status);
    }

    await expect(
      models.Office.create({
        name: "Invalid Office",
        branch_id: 1,
        type: "Private",
        status: "InvalidStatus",
      })
    ).rejects.toThrow();
  });

});