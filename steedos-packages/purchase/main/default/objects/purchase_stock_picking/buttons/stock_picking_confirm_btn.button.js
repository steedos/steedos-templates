module.exports = {

    stock_picking_confirm_btn: function(objectApiName, record_id) {


        $(document.body).addClass('loading');
        let url = `/api/get/stock/picking/numberstatus/` + record_id;
        let options = {
            type: 'get',
            async: true,

            success: function(data) {
                $(document.body).removeClass('loading');
                if (data.status == false) {
                    swal({
                        title: "请确认是否继续入库操作？",
                        html: !0,
                        showCancelButton: !0,
                        confirmButtonText: '继续',
                        cancelButtonText: "取消"
                    },
                    function(t1) {
                        if(t1){
                            swal({
                                title: "是否生成欠单？",
                                html: !0,
                                showCancelButton: !0,
                                confirmButtonText: '生成欠单',
                                cancelButtonText: "不生成"
                            },
                            function(t) {
                                if (t) {
                                    Creator.odata.update("purchase_stock_picking", record_id, {
                                        state: "已入库",
                                        confirm_btn: true
                                    }, function() {
                                        FlowRouter.reload()
                                    })
    
                                } else {
                                    Creator.odata.update("purchase_stock_picking", record_id, {
                                        state: "已入库",
                                        confirm_btn: false
                                    }, function() {
                                        FlowRouter.reload()
                                    })
                                }
                            })
                            return aa['xxx']['bbb'];
                            return false;
                        }else{
                            FlowRouter.reload()
                        }
                    })
                    
                }else{
                    Creator.odata.update("purchase_stock_picking", record_id, {
                        state: "已入库",
                        confirm_btn: true
                    }, function() {
                        Creator.odata.update("purchase_order", Creator.getObjectRecord().purchase_order_id, {
                            state: "结束",
                        }, function() {
                            FlowRouter.reload()
                        })
                    })

                    
                }


            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                toastr.error(t(XMLHttpRequest.responseJSON.message))
                $(document.body).removeClass('loading');
            }
        };
        Steedos.authRequest(url, options);

        // swal({
        //         title: "是否生成欠单？",
        //         html: !0,
        //         showCancelButton: !0,
        //         confirmButtonText: '生成欠单',
        //         cancelButtonText: "不生成"
        //     },
        //     function(t) {
        //         if (t) {
        //             Creator.odata.update("purchase_stock_picking", record_id, {
        //                 state: "已入库",
        //                 confirm_btn: true
        //             }, function() {
        //                 SteedosUI.reloadRecord(objectApiName, record_id);
        //             })

        //         } else {
        //             Creator.odata.update("purchase_stock_picking", record_id, {
        //                 state: "入库中",
        //                 confirm_btn: false
        //             }, function() {
        //                 SteedosUI.reloadRecord(objectApiName, record_id);
        //             })
        //         }
        //     })
    },
    stock_picking_confirm_btnVisible: function(object_name, record_id, permissions, record) {
        return record.state === '入库中';
    }

}