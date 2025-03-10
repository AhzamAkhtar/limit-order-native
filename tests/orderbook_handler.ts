import BN from "bn.js";
import * as fs from "fs";

export class OrderList {
    constructor(
        public order_id : number,
        public side: string,
        public amount: number,
        public price: number
    ) {}
}

export class OrderBookData {
    public orders: OrderList[] = [];
    private filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
        this.loadFromFile();
    }

    // Load orders from file 
    private loadFromFile() {
        if (fs.existsSync(this.filePath)) {
            const data = fs.readFileSync(this.filePath, "utf-8");
            this.orders = JSON.parse(data);
           
        } else {
            console.log("Order book file does not exist, starting fresh.");
        }
    }

    // Save orders to file
    private saveToFile() {
        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.orders, null, 2));
        } catch (error) {
            console.error("Failed to save order book:", error);
        }
    }

    // Add a new order
    public addOrder(order: OrderList) {
        this.orders.push(order);
        this.saveToFile();
    }

    // Remove an order by ID
    public removeOrderById(orderId: number) {
        const initialLength = this.orders.length;
        this.orders = this.orders.filter(order => order.order_id !== orderId);
        if (this.orders.length < initialLength) {
            this.saveToFile();
        } else {
            console.log(`Order not found in the orderbook`);
        }
    }

    // fill in the partial trade
    public fill_partial_order(orderId : number, trade_amount : number) {
        const order = this.orders.find(order => order.order_id == orderId)
        if(order) {
            order.amount = order.amount - trade_amount
            this.saveToFile()
        } else {
            console.log("Order not found in the orderbook")
        }
    }

    // Get all orders
    public getOrders(): OrderList[] {
        return this.orders;
    }
}
