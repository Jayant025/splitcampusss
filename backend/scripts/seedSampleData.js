const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, "../.env")
});

const connectDB = require("../src/config/db");
const Activity = require("../src/models/Activity");
const Expense = require("../src/models/Expense");
const Group = require("../src/models/Group");
const PersonalExpense = require("../src/models/PersonalExpense");
const Settlement = require("../src/models/Settlement");
const User = require("../src/models/User");
const hii = 20;
const seed = async () => {
  try {
    await connectDB();

    await Promise.all([
      Activity.deleteMany({}),
      Settlement.deleteMany({}),
      Expense.deleteMany({}),
      PersonalExpense.deleteMany({}),
      Group.deleteMany({}),
      User.deleteMany({})
    ]);

    const users = await User.create([
      {
        name: "Aarav Mehta",
        email: "aarav@example.com",
        password: "password123"
      },
      {
        name: "Riya Sharma",
        email: "riya@example.com",
        password: "password123"
      },
      {
        name: "Kabir Khan",
        email: "kabir@example.com",
        password: "password123"
      }
    ]);

    const [aarav, riya, kabir] = users;

    const group = await Group.create({
      name: "Block A Hostel Room",
      description: "Shared hostel room expenses for snacks, Wi-Fi, groceries, and electricity.",
      type: "hostel",
      createdBy: aarav._id,
      inviteCode: "ROOM2026",
      members: [
        {
          user: aarav._id,
          role: "admin"
        },
        {
          user: riya._id,
          role: "member"
        },
        {
          user: kabir._id,
          role: "member"
        }
      ]
    });

    await Expense.create([
      {
        group: group._id,
        title: "Monthly Wi-Fi Recharge",
        amount: 1500,
        date: new Date(),
        description: "Shared room Wi-Fi top-up",
        paidBy: aarav._id,
        category: "wifi",
        splitType: "equal",
        splitMembers: [
          {
            user: aarav._id,
            amount: 500,
            percentage: 33.33,
            selected: true
          },
          {
            user: riya._id,
            amount: 500,
            percentage: 33.33,
            selected: true
          },
          {
            user: kabir._id,
            amount: 500,
            percentage: 33.34,
            selected: true
          }
        ],
        createdBy: aarav._id,
        updatedBy: aarav._id
      },
      {
        group: group._id,
        title: "Late-night food order",
        amount: 900,
        date: new Date(),
        description: "Dinner order for the room",
        paidBy: riya._id,
        category: "food",
        splitType: "exact",
        splitMembers: [
          {
            user: aarav._id,
            amount: 250,
            percentage: 27.78,
            selected: true
          },
          {
            user: riya._id,
            amount: 350,
            percentage: 38.89,
            selected: true
          },
          {
            user: kabir._id,
            amount: 300,
            percentage: 33.33,
            selected: true
          }
        ],
        createdBy: riya._id,
        updatedBy: riya._id
      }
    ]);

    await Settlement.create({
      group: group._id,
      paidBy: kabir._id,
      receivedBy: aarav._id,
      amount: 250,
      note: "Partial payback for shared internet and snacks",
      date: new Date(),
      createdBy: kabir._id
    });

    await PersonalExpense.create([
      {
        user: aarav._id,
        title: "Library printouts",
        amount: 180,
        category: "education",
        date: new Date(),
        note: "Semester project handouts"
      },
      {
        user: aarav._id,
        title: "Bus pass recharge",
        amount: 650,
        category: "transport",
        date: new Date(),
        note: "Monthly city commute pass"
      },
      {
        user: riya._id,
        title: "Movie night snacks",
        amount: 320,
        category: "entertainment",
        date: new Date(),
        note: "Personal snacks during club event"
      }
    ]);

    await Activity.create([
      {
        group: group._id,
        user: aarav._id,
        type: "group_created",
        message: "Aarav Mehta created the group Block A Hostel Room."
      },
      {
        group: group._id,
        user: aarav._id,
        type: "expense_added",
        message: "Aarav Mehta added the expense Monthly Wi-Fi Recharge."
      },
      {
        group: group._id,
        user: riya._id,
        type: "expense_added",
        message: "Riya Sharma added the expense Late-night food order."
      },
      {
        group: group._id,
        user: kabir._id,
        type: "settlement_added",
        message: "Kabir Khan recorded a settlement of Rs. 250."
      }
    ]);

    console.log("Sample data seeded successfully.");
    console.log("Sample login emails:");
    console.log("- aarav@example.com");
    console.log("- riya@example.com");
    console.log("- kabir@example.com");
    console.log("Password for all users: password123");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seed();
