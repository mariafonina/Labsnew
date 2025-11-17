import { Router, Request, Response } from "express";
import { query } from "../../db";
import { asyncHandler } from "../../utils/async-handler";

const router = Router();

router.get(
  "/stats",
  asyncHandler(async (req: Request, res: Response) => {
    const [
      usersResult,
      productsResult,
      cohortsResult,
      tiersResult,
      enrollmentsResult,
    ] = await Promise.all([
      query("SELECT COUNT(*) as total FROM labs.users"),
      query("SELECT COUNT(*) as total FROM labs.products WHERE is_active = TRUE"),
      query("SELECT COUNT(*) as total FROM labs.cohorts WHERE is_active = TRUE"),
      query("SELECT COUNT(*) as total FROM labs.pricing_tiers WHERE is_active = TRUE"),
      query(`
        SELECT 
          COUNT(DISTINCT user_id) as enrolled_users,
          SUM(pt.price) as total_revenue
        FROM labs.user_enrollments ue
        LEFT JOIN labs.pricing_tiers pt ON ue.pricing_tier_id = pt.id
        WHERE ue.status = 'active'
      `),
    ]);

    const totalUsers = parseInt(usersResult.rows[0]?.total || "0");
    const totalProducts = parseInt(productsResult.rows[0]?.total || "0");
    const totalCohorts = parseInt(cohortsResult.rows[0]?.total || "0");
    const totalTiers = parseInt(tiersResult.rows[0]?.total || "0");
    const enrolledUsers = parseInt(enrollmentsResult.rows[0]?.enrolled_users || "0");
    const totalRevenue = parseFloat(enrollmentsResult.rows[0]?.total_revenue || "0");
    const averageCheck = enrolledUsers > 0 ? Math.round(totalRevenue / enrolledUsers) : 0;

    res.json({
      totalUsers,
      totalProducts,
      totalCohorts,
      totalTiers,
      totalRevenue: Math.round(totalRevenue),
      averageCheck,
    });
  })
);

export default router;
