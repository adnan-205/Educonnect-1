import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Activity from '../models/Activity';
import Booking from '../models/Booking';
import Payment from '../models/Payment';

export const listUsers = async (req: Request, res: Response) => {
  try {
    const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10), 1), 100);
    const skip = (page - 1) * limit;

    const q = String(req.query.q || '').trim();
    const role = String(req.query.role || '').trim();
    const isOnboardedParam = String(req.query.isOnboarded || '').trim();

    const filter: any = {};
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }
    if (role && ['student', 'teacher', 'admin'].includes(role)) {
      filter.role = role;
    }
    if (isOnboardedParam === 'true') filter.isOnboarded = true;
    if (isOnboardedParam === 'false') filter.isOnboarded = false;

    const [items, total] = await Promise.all([
      User.find(filter)
        .select('name email role isOnboarded avatar createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: items.length,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: items,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error listing users' });
  }
};

export const getUserByAdmin = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const user = await User.findById(id)
      .select('name email role isOnboarded avatar createdAt updatedAt profile phone location headline');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching user' });
  }
};

export const listActivities = async (req: Request, res: Response) => {
  try {
    const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10), 1), 200);
    const skip = (page - 1) * limit;

    const userId = String(req.query.userId || '').trim();
    const action = String(req.query.action || '').trim();
    const targetType = String(req.query.targetType || '').trim();
    const from = String(req.query.from || '').trim();
    const to = String(req.query.to || '').trim();

    const filter: any = {};
    if (userId && mongoose.isValidObjectId(userId)) filter.user = new mongoose.Types.ObjectId(userId);
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    const [items, total] = await Promise.all([
      Activity.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email avatar role')
        .lean(),
      Activity.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: items.length,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: items,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error listing activities' });
  }
};

export const getUserActivities = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = Math.max(parseInt(String(req.query.page || '1'), 10), 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10), 1), 200);
    const skip = (page - 1) * limit;
    const action = String(req.query.action || '').trim();

    const filter: any = { user: new mongoose.Types.ObjectId(id) };
    if (action) filter.action = action;

    const [items, total] = await Promise.all([
      Activity.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Activity.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: items.length,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: items,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching user activities' });
  }
};

// GET /api/admin/analytics/classes?from=&to=&teacherId=&status=
export const getClassAnalytics = async (req: Request, res: Response) => {
  try {
    const fromStr = String(req.query.from || '');
    const toStr = String(req.query.to || '');
    const teacherId = String(req.query.teacherId || '').trim();
    const status = String(req.query.status || '').trim();

    // Default range: last 30 days
    const to = toStr ? new Date(toStr) : new Date();
    const from = fromStr ? new Date(fromStr) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

    const match: any = {
      $and: [
        { $expr: { $gte: [ { $ifNull: ['$scheduledAt', '$createdAt'] }, from ] } },
        { $expr: { $lt:  [ { $ifNull: ['$scheduledAt', '$createdAt'] }, to ] } },
      ]
    };

    if (status && ['pending','accepted','rejected','completed'].includes(status)) {
      match.status = status;
    }

    // Optional filter by teacher through Gig lookup
    let teacherPipeline: any[] = [];
    if (teacherId && mongoose.isValidObjectId(teacherId)) {
      teacherPipeline = [
        { $lookup: { from: 'gigs', localField: 'gig', foreignField: '_id', as: 'gigDoc' } },
        { $unwind: '$gigDoc' },
        { $match: { 'gigDoc.teacher': new mongoose.Types.ObjectId(teacherId) } },
      ];
    }

    // Summary by status and attendance
    const summaryPromise = Booking.aggregate([
      ...teacherPipeline,
      { $match: match },
      { $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status','pending'] }, 1, 0] } },
          accepted: { $sum: { $cond: [{ $eq: ['$status','accepted'] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ['$status','rejected'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status','completed'] }, 1, 0] } },
          attended: { $sum: { $cond: [{ $eq: ['$attended', true] }, 1, 0] } },
        }
      },
    ]).then(rows => rows[0] || { total: 0, pending: 0, accepted: 0, rejected: 0, completed: 0, attended: 0 });

    // Timeseries per day and status
    const timeseriesPromise = Booking.aggregate([
      ...teacherPipeline,
      { $match: match },
      { $addFields: { ts: { $ifNull: ['$scheduledAt', '$createdAt'] } } },
      { $project: {
          status: 1,
          day: { $dateToString: { format: '%Y-%m-%d', date: '$ts' } },
        }
      },
      { $group: { _id: { day: '$day', status: '$status' }, count: { $sum: 1 } } },
      { $sort: { '_id.day': 1 } },
    ]).then(rows => {
      const map: Record<string, any> = {};
      for (const r of rows) {
        const day = r._id.day as string;
        const st = r._id.status as string;
        if (!map[day]) map[day] = { date: day, pending: 0, accepted: 0, rejected: 0, completed: 0 };
        (map[day] as any)[st] = r.count;
        map[day].total = (map[day].pending || 0) + (map[day].accepted || 0) + (map[day].rejected || 0) + (map[day].completed || 0);
      }
      // Fill missing days in range for smoother charts
      const out: any[] = [];
      const cursor = new Date(from);
      const end = new Date(to);
      while (cursor < end) {
        const d = cursor.toISOString().slice(0,10);
        out.push(map[d] || { date: d, pending: 0, accepted: 0, rejected: 0, completed: 0, total: 0 });
        cursor.setDate(cursor.getDate() + 1);
      }
      return out;
    });

    // Top teachers by completed classes in range (honor teacherId filter if provided)
    const topTeachersPromise = Booking.aggregate([
      ...(teacherPipeline.length ? teacherPipeline : [
        { $lookup: { from: 'gigs', localField: 'gig', foreignField: '_id', as: 'gigDoc' } },
        { $unwind: '$gigDoc' },
      ]),
      { $match: match },
      { $group: {
          _id: '$gigDoc.teacher',
          bookings: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status','completed'] }, 1, 0] } },
        }
      },
      { $sort: { completed: -1, bookings: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'teacher' } },
      { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, teacherId: '$_id', name: '$teacher.name', email: '$teacher.email', bookings: 1, completed: 1 } },
    ]);

    // Revenue from successful payments in range
    const paymentMatch: any = { status: 'SUCCESS', createdAt: { $gte: from, $lt: to } };
    if (teacherId && mongoose.isValidObjectId(teacherId)) {
      paymentMatch.teacherId = new mongoose.Types.ObjectId(teacherId);
    }
    const revenuePromise = Payment.aggregate([
      { $match: paymentMatch },
      { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: '$amount' } } },
    ]).then(rows => rows[0] || { count: 0, amount: 0 });

    const [summary, series, topTeachers, revenue] = await Promise.all([
      summaryPromise, timeseriesPromise, topTeachersPromise, revenuePromise,
    ]);

    const conversionBase = (summary.pending || 0) + (summary.accepted || 0) + (summary.rejected || 0);
    const conversionRate = conversionBase > 0 ? Number(((summary.accepted || 0) / conversionBase * 100).toFixed(2)) : 0;
    const attendanceRate = (summary.completed || 0) > 0 ? Number(((summary.attended || 0) / summary.completed * 100).toFixed(2)) : 0;

    return res.json({
      success: true,
      data: {
        summary: {
          total: summary.total || 0,
          pending: summary.pending || 0,
          accepted: summary.accepted || 0,
          rejected: summary.rejected || 0,
          completed: summary.completed || 0,
          attended: summary.attended || 0,
          conversionRate,
          attendanceRate,
        },
        revenue,
        timeseries: series,
        topTeachers,
        range: { from, to },
      },
    });
  } catch (err) {
    console.error('getClassAnalytics error:', err);
    res.status(500).json({ success: false, message: 'Error generating class analytics' });
  }
};
