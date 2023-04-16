import { Database } from "../src/database";
import { APPS_PRICING_PLANS, CATEGORIES, PRICING_PLANS } from "../src/shopify-table-names";
import { minutes } from "./utils";

describe("Queries Across Tables", () => {
    let db: Database;

    beforeAll(async () => {
        db = await Database.fromExisting("03", "04");
    }, minutes(1));

    it("should select count of apps which have free pricing plan", async done => {
        const query = `SELECT COUNT(*) AS count
        FROM ${APPS_PRICING_PLANS}
        WHERE pricing_plan_id = '1' OR pricing_plan_id = '13'`;
        const result = await db.selectSingleRow(query);
        expect(result).toEqual({
            count: 1112
        });
        done();
    }, minutes(1));

    it("should select top 3 most common categories", async done => {
        const query = `SELECT COUNT(*) AS count, CATEGORIES.title as category
        FROM ${CATEGORIES}
        JOIN APPS_CATEGORIES ON CATEGORIES.id = APPS_CATEGORIES.category_id
        JOIN APPS ON APPS_CATEGORIES.app_id = APPS.id
        GROUP BY category
        ORDER BY count DESC
        LIMIT 3`;
        const result = await db.selectMultipleRows(query);
        expect(result).toEqual([
            { count: 1193, category: "Store design" },
            { count: 723, category: "Sales and conversion optimization" },
            { count: 629, category: "Marketing" }
        ]);
        done();
    }, minutes(1));

    it("should select top 3 prices by appearance in apps and in price range from $5 to $10 inclusive (not matters monthly or one time payment)", async done => {
        const query = `SELECT COUNT(*) AS count, price, CAST(SUBSTR(price, 2) AS DECIMAL) AS casted_price
        FROM ${PRICING_PLANS}
        INNER JOIN apps_pricing_plans ON pricing_plans.id = apps_pricing_plans.pricing_plan_id
        WHERE casted_price BETWEEN 5 AND 10
        GROUP BY casted_price
        ORDER BY count DESC
        LIMIT 3`;
        const result = await db.selectMultipleRows(query);
        expect(result).toEqual([
            { count: 225, price: "$9.99/month", casted_price: 9.99 },
            { count: 135, price: "$5/month", casted_price: 5 },
            { count: 114, price: "$10/month", casted_price: 10 }
        ]);
        done();
    }, minutes(1));
});