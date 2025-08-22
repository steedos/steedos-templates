module.exports = {

    one_keyend_btn: function(objectApiName, record_id) {
        console.log(objectApiName)
        console.log(record_id)
        swal({
                title: "是否一键完成采购单？",

                html: !0,
                showCancelButton: !0,
                confirmButtonText: '确定',
                cancelButtonText: "取消"
            },
            function(t) {
                if (t) {
                    Creator.odata.update("purchase_stock_picking", record_id, {
                        state: "已入库",
                        onekey: true
                    }, function() {
                        FlowRouter.reload()
                    })

                }
            })
    },
    one_keyend_btnVisible: function(object_name, record_id, permissions, record) {
        return record.state === '入库中';
    }

}