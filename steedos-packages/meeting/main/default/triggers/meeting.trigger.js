
/**
 * 检查指定会议室和时间段内是否存在会议冲突。
 *
 * @param {string} _id - 当前会议的ID（新增时为null或undefined）。
 * @param {string} room - 会议室ID。
 * @param {Date} start - 会议开始时间。
 * @param {Date} end - 会议结束时间。
 * @param {Function} getObject - 用于获取对象数据库操作方法的函数 (this.getObject)。
 * @returns {Promise<number>} - 冲突的会议数量。
 */
const clashRemind = async function (_id, room, start, end, getObject) {
  const conflictFilters = [
    // 排除当前会议并限定会议室
    [
      ['_id', '<>', _id],
      ['room', '=', room]
    ],
    'and',
    // 时间冲突逻辑 ($or: [ {start <= new.start && end > new.start}, {start < new.end && end >= new.end}, {start >= new.start && end <= new.end} ])
    [
      // 1. 新会议开始时间被占用 (start <= new.start && end > new.start)
      [
        ['start', '<=', start], 'and', ['end', '>', start]
      ], 'or',
      // 2. 新会议结束时间被占用 (start < new.end && end >= new.end)
      [
        ['start', '<', end], 'and', ['end', '>=', end]
      ], 'or',
      // 3. 现有会议完全包含新会议 (start >= new.start && end <= new.end)
      [
        ['start', '>=', start], 'and', ['end', '<=', end]
      ]
    ]
  ];

  const meetings = await getObject("meeting").find({
    filters: conflictFilters,
    fields: ["_id"]
  });

  return meetings.length;
};

/**
 * 权限检查辅助函数
*/
const checkPermission = async function (userId, roomId, getObject) {
  if (!roomId) {
    return true;
  }

  const meetingRoom = await getObject('meetingroom').findOne(roomId, {
    fields: ['admins', 'enable_open']
  });
  console.log("===checkPermission==meetingRoom===", meetingRoom);

  if (!meetingRoom) {
    throw new Error("会议室不存在");
  }

  const isAdmin = Array.isArray(meetingRoom.admins) && meetingRoom.admins.includes(userId);
  const isOpen = meetingRoom.enable_open === true;

  // 如果是管理员或者会议室开放，则允许操作
  if (isAdmin || isOpen) {
    return true;
  } else {
    // 既不是管理员，会议室也不开放，抛出权限错误
    throw new Error("此会议室为特约会议室，您暂无权限预约。");
  }
}


  module.exports = {
    listenTo: 'meeting',

    beforeInsert: async function () {
      const doc = this.doc;
      const getObject = this.getObject;
      const {
        userId
      } = this;

      await checkPermission(userId, doc.room, getObject);

      // 检查时间有效性
      if (doc.end <= doc.start) {
        throw new Error("开始时间需小于结束时间");
      }

      const clashs = await clashRemind(null, doc.room, doc.start, doc.end, getObject);

      if (clashs > 0) {
        throw new Error("该时间段的此会议室已被占用");
      }
    },

    beforeUpdate: async function () {
      const doc = this.doc;
      const getObject = this.getObject;
      const {
        userId
      } = this;
      let room, start, end;

      // 1. 获取更新后的 start 和 end 时间
      start = doc.start;
      end = doc.end;
      room = doc.room;

      // 如果 doc 中没有 start/end/room，需要从数据库中获取当前文档的旧值。
      if (start === undefined || end === undefined || room === undefined) {
        // 仅查询需要的值
        const fieldsToFetch = [];
        if (start === undefined) fieldsToFetch.push('start');
        if (end === undefined) fieldsToFetch.push('end');
        if (room === undefined) fieldsToFetch.push('room');

        // 如果有任何一个值缺失，需要查询数据库
        if (fieldsToFetch.length > 0) {
          const currentDoc = await getObject('meeting').findOne(this.id, {
            fields: fieldsToFetch
          });

          // 使用数据库旧值补充缺失的值
          start = start !== undefined ? start : currentDoc.start;
          end = end !== undefined ? end : currentDoc.end;
          room = room !== undefined ? room : currentDoc.room;
        }
      }

      await checkPermission(userId, room, getObject);
      
      // 2. 检查时间有效性
      if (end <= start) {
        throw new Error("开始时间不能大于结束时间");
      }

      // 3. 检查冲突
      const clashs = await clashRemind(this.id, room, start, end, getObject);

      if (clashs > 0) {
        throw new Error("该时间段的此会议室已被占用");
      }
    }
  };