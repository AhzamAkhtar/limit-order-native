import * as fs from "fs";

export class OrderList {
    constructor(
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

    // Load orders from file (if exists)
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

    // Get all orders
    public getOrders(): OrderList[] {
        return this.orders;
    }
}
