module.exports = {

    add_stock_deliver_btn: function(object_name, record_id) {
        const stock_picking_info = Creator.getObjectRecord()
        const stock_picking_item_info = Creator.getObjectRecord(object_name, record_id, [])
        console.log("===================")
        console.log(stock_picking_item_info)
        SteedosUI.showModal(stores.ComponentRegistry.components.ObjectForm, {
            name: `add_stock_deliver_form`, // 表单名称
            objectApiName: 'purchase_stock_delivery', // 所属对象
            title: '新建入库交货明细', // 弹窗标题
            initialValues: {
                product_id: stock_picking_item_info.product_id,
                amount_demand: stock_picking_item_info.amount_demand - stock_picking_item_info.amount_received,
                // amount_received: stock_picking_item_info.amount_demand - stock_picking_item_info.amount_received,
                stock_picking_item_id: stock_picking_item_info._id,
                unit: stock_picking_item_info.unit,
                warehouse: stock_picking_info.warehouse_id,
                location: stock_picking_info.location_id,
                date_stock:new Date()

            },
            onFinish: async (values)=>{
                
                Creator.odata.insert("purchase_stock_delivery", values, function() {
                    FlowRouter.reload()
                })
                SteedosUI.reloadObject("purchase_product_stock")
                SteedosUI.reloadObject("purchase_stock_picking")
                return true;
                
            }
        }, null, {
            iconPath: '/assets/icons'
        });
    },
    add_stock_deliver_btnVisible: function(object_name, record_id, permissions, record) {
        const stock_picking_item_info = Creator.getObjectRecord(object_name, record_id, [])
        return Creator.getObjectRecord().state === '入库中' && (stock_picking_item_info.amount_demand - stock_picking_item_info.amount_received > 0);
    }

}