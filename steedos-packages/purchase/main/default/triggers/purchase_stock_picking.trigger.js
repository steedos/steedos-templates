const objectql = require('@steedos/objectql');

module.exports = {
    listenTo: 'purchase_stock_picking',

    beforeUpdate: async function(){
        if(this.doc.onekey){
            const query = {
                fields: [],
                
            };
            const { spaceId, userId } = this
            var now = new Date();
            const stock_pickingInfo = await objectql.getObject("purchase_stock_picking").findOne(this.id, query);
            const stock_picking_itemList = await objectql.getObject("purchase_stock_picking_item").find( { fields: [],filters: [['stock_picking_id','contains',this.id]]});
            for (const key in stock_picking_itemList) {
                if(typeof(stock_picking_itemList[key]) == 'object'){
                    const stock_deliveryDoc = {
                        product_id:stock_picking_itemList[key].product_id,
                        amount_demand:stock_picking_itemList[key].amount_demand-stock_picking_itemList[key].amount_received,
                        amount_received:stock_picking_itemList[key].amount_demand-stock_picking_itemList[key].amount_received,
                        unit:stock_picking_itemList[key].unit,
                        warehouse:stock_pickingInfo.warehouse_id,
                        location:stock_pickingInfo.location_id,
                        date_stock:now,
                        stock_picking_item_id:stock_picking_itemList[key]._id,
                        created_by: userId,
                        modified_by: userId,
                        created: now,
                        modified: now,
                        space: spaceId,
                    }

                    const stock_deliveryResult = await objectql.getObject("purchase_stock_delivery").insert(stock_deliveryDoc);

                    const orderItemInfo = await objectql.getObject("purchase_order_item").findOne(stock_picking_itemList[key].purchase_order_line, query);
                    await objectql.getObject("purchase_order_item").update(stock_picking_itemList[key].purchase_order_line, {amount_receiverd:orderItemInfo.amount_demand,delivery_date:new Date()});
                }
            }

            await objectql.getObject("purchase_order").update(stock_pickingInfo.purchase_order_id, {state:"结束"});
            
        }else if(this.doc.confirm_btn != undefined && this.doc.confirm_btn){
            //生成欠单
            // 重置需求数 start
            const stock_picking_itemList = await objectql.getObject("purchase_stock_picking_item").find( { fields: [],filters: [['stock_picking_id','contains',this.id]]});
            //需求值更改为接收值
            for (const key in stock_picking_itemList) {
                if(typeof(stock_picking_itemList[key]) == 'object'){
                    if(stock_picking_itemList[key].amount_demand > stock_picking_itemList[key].amount_received){
                        await objectql.getObject("purchase_stock_picking_item").update(stock_picking_itemList[key]._id, {amount_demand:stock_picking_itemList[key].amount_received});
                    }
                }
            }
            //end


            
            const objectApiName = "purchase_order";
            var now = new Date();
            const query = {
                fields: [],
                
            };
            const { spaceId, userId } = this
            const stock_pickingInfo = await objectql.getObject("purchase_stock_picking").findOne(this.id, query);
            const result = await objectql.getObject(objectApiName).findOne(stock_pickingInfo.purchase_order_id, query);
            
            const stock_picking_doc = {
                partner: result.vendor,
                state: '入库中',
                warehouse_id: result.warehouse_id,
                location_id: result.location_id,
                purchase_order_id: stock_pickingInfo.purchase_order_id,
                created_by: userId,
                modified_by: userId,
                created: now,
                modified: now,
                space: spaceId,
            }

            const pick_result = await objectql.getObject("purchase_stock_picking").insert(stock_picking_doc);


            const orderItemList = await objectql.getObject("purchase_order_item").find( { fields: [],filters: [['purchase_order','contains',stock_pickingInfo.purchase_order_id]]});
            
            for (const key in orderItemList) {
                
                if(typeof(orderItemList[key]) == 'object'){

                    if(orderItemList[key].amount_receiverd == undefined){
                        orderItemList[key].amount_receiverd = 0;
                    }

                    if(orderItemList[key].amount_demand - orderItemList[key].amount_receiverd > 0){
                        const stock_picking_item_doc = {
                            product_id:orderItemList[key].material_coding,
                            amount_demand:orderItemList[key].amount_demand - orderItemList[key].amount_receiverd,
                            amount_received:0,
                            unit:orderItemList[key].unit,
                            purchase_order_line:orderItemList[key]._id,
                            stock_picking_id:pick_result._id,
                            space: spaceId,
                            created_by: userId,
                            modified_by: userId,
                            created: now,
                            modified: now
        
        
                        }
                        const stock_picking_item_result = await objectql.getObject("purchase_stock_picking_item").insert(stock_picking_item_doc);
                    }
                }
                
            }


        }else if(this.doc.confirm_btn != undefined && this.doc.confirm_btn == false){
            //不生产欠单
            const stock_picking_itemList = await objectql.getObject("purchase_stock_picking_item").find( { fields: [],filters: [['stock_picking_id','contains',this.id]]});
            // 需求值更改为接收值
            for (const key in stock_picking_itemList) {
                if(typeof(stock_picking_itemList[key]) == 'object'){
                    if(stock_picking_itemList[key].amount_demand > stock_picking_itemList[key].amount_received){
                        await objectql.getObject("purchase_stock_picking_item").update(stock_picking_itemList[key]._id, {amount_demand:stock_picking_itemList[key].amount_received});
                    }
                }
            }

            const stock_pickingInfo = await objectql.getObject("purchase_stock_picking").findOne(this.id, {});

            await objectql.getObject("purchase_order").update(stock_pickingInfo.purchase_order_id, {state:"结束"});

            

        }
    },

}