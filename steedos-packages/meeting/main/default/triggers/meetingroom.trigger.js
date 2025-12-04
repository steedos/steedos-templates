/*
 * @Author: 殷亮辉 yinlianghui@hotoa.com
 * @Date: 2025-11-21 21:47:47
 * @LastEditors: 殷亮辉 yinlianghui@hotoa.com
 * @LastEditTime: 2025-11-24 17:03:22
 */
module.exports = {
  listenTo: 'meetingroom',

  beforeInsert: async function () {
    const doc = this.doc;

    // 确保 doc.admins 是一个数组，如果不存在则初始化为空数组
    doc.admins = doc.admins ?? []; 

    // 检查 doc.admins 中是否包含 doc.owner，如果没有，则添加它
    if (!doc.admins.includes(doc.owner)) {
      doc.admins.push(doc.owner);
    }
  }
};