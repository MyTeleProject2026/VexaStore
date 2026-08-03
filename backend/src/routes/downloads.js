// ============================================================
// GET: Download statistics
// ============================================================
router.get('/stats', async (req, res, next) => {
  try {
    const { period = '30d' } = req.query;
    
    let dateCondition = '';
    if (period === '7d') {
      dateCondition = `AND dl.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`;
    } else if (period === '30d') {
      dateCondition = `AND dl.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`;
    } else if (period === '90d') {
      dateCondition = `AND dl.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)`;
    }
    
    // ✅ FIXED: Use table aliases for all columns
    const [totalRows] = await pool.query(
      `SELECT COUNT(*) as total FROM download_logs dl WHERE 1=1 ${dateCondition.replace('AND', 'AND')}`
    );
    
    // ✅ FIXED: Use table alias "dl"
    const [osRows] = await pool.query(
      `SELECT dl.os, COUNT(*) as count FROM download_logs dl 
       WHERE dl.os IS NOT NULL ${dateCondition.replace('AND', 'AND')}
       GROUP BY dl.os`
    );
    
    // ✅ FIXED: Use table aliases "a" and "dl"
    const [topApps] = await pool.query(
      `SELECT a.id, a.name, a.slug, COUNT(dl.id) as downloads 
       FROM download_logs dl
       JOIN apps a ON a.id = dl.app_id
       WHERE 1=1 ${dateCondition.replace('AND', 'AND')}
       GROUP BY dl.app_id
       ORDER BY downloads DESC
       LIMIT 10`
    );
    
    // ✅ FIXED: Use table alias "dl"
    const [dailyRows] = await pool.query(
      `SELECT DATE(dl.created_at) as date, COUNT(*) as count 
       FROM download_logs dl
       WHERE dl.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(dl.created_at)
       ORDER BY date ASC`
    );
    
    res.json({
      success: true,
      data: {
        total: totalRows[0]?.total || 0,
        by_os: osRows,
        top_apps: topApps,
        daily: dailyRows
      }
    });
  } catch (error) {
    next(error);
  }
});