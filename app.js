/* 
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
+++++++++++++++++THE CODE START FROM HERE++++++++++++++++++++++++++++
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
*/

//  BUDGET DATA MODULE

var budgetController = (function () {
	var Income = function (id, description, value) {
		this.id = id;
		this.description = description;
		this.value = value;
	};

	var Expense = function (id, description, value) {
		this.id = id;
		this.description = description;
		this.value = value;
		this.percentage = -1;
	};

	Expense.prototype.calcPercentage = function (totalInc) {
		if (totalInc > 0)
			this.percentage = Math.round((this.value / totalInc) * 100);
		else this.percentage = -1;
	};

	Expense.prototype.getPercentage = function () {
		return this.percentage;
	};

	var data = {
		allItems: {
			inc: [],
			exp: [],
		},
		totals: {
			inc: 0,
			exp: 0,
		},
		budget: 0,
		percentage: -1,
	};

	var calculateTotal = function (type) {
		var sum = 0;

		data.allItems[type].forEach(function (cur) {
			sum += cur.value;
		});

		data.totals[type] = sum;
	};

	return {
		validateInput: function (obj) {
			return obj.type && obj.description.trim().length && obj.value > 0
				? true
				: false;
		},

		addItem: function (obj) {
			var id, newItem;

			// 1. Before creating any item we will be needing an ID
			//    [1 2 3 4] next ID = 5
			//    [1 3 7] next ID = 8
			//    [] next ID = 0
			id = !data.allItems[obj.type].length
				? 0
				: data.allItems[obj.type][data.allItems[obj.type].length - 1].id + 1;

			// 2. Create new INC or EXP as per the given type
			newItem =
				obj.type === "inc"
					? new Income(id, obj.description, obj.value)
					: new Expense(id, obj.description, obj.value);

			// 3. Push the new Item to the DS
			data.allItems[obj.type].push(newItem);

			return newItem;
		},

		calculateBudget: function () {
			// How are we going to calculate the budget?
			// -> 1st we need to know the total of income as well as expenses
			calculateTotal("inc");
			calculateTotal("exp");

			// -> 2nd budget = totalIncome - totalExpenses
			data.budget = data.totals.inc - data.totals.exp;

			// -> 3rd calculate the percentage of budget that has been spent
			if (data.totals.inc > 0)
				data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
			else data.percentage = -1;
		},

		getBudget: function () {
			return {
				income: data.totals.inc,
				expense: data.totals.exp,
				budget: data.budget,
				percentage: data.percentage,
			};
		},

		calculatePercentages: function () {
			data.allItems.exp.forEach(function (cur) {
				cur.calcPercentage(data.totals.inc);
			});
		},

		getPercentages: function () {
			var allPerc;
			allPerc = data.allItems.exp.map(function (cur) {
				return cur.getPercentage();
			});

			return allPerc;
		},

		deleteItem: function (type, id) {
			var ids, index;

			ids = data.allItems[type].map(function (current) {
				return current.id;
			});

			index = ids.indexOf(id);
			if (index !== -1) data.allItems[type].splice(index, 1);
		},
	};
})();

//  UI MODULE

var UIController = (function () {
	var DOMstrings = {
		addButton: ".add__btn",
		inputType: ".add__type",
		inputDescription: ".add__description",
		inputValue: ".add__value",
		incomeList: ".income__list",
		expensesList: ".expenses__list",
		budget: ".budget__value",
		budgetIncome: ".budget__income--value",
		budgetExpenses: ".budget__expenses--value",
		budgetPercentage: ".budget__expenses--percentage",
		expensesPercLabel: ".item__percentage",
		container: ".container",
		budgetTitle: ".budget__title--month",
	};

	var formatNumber = function (type, value, sign) {
		var number, int, dec;

		if (!sign) {
			sign = type === "inc" ? "+" : "-";
		}

		value = Math.abs(value);
		value = value.toFixed(2);

		number = value.split(".");

		int = number[0];
		dec = number[1];

		if (int.length > 3)
			int = int.substr(0, int.length - 3) + "," + int.substr(int.length - 3, 3);

		return sign + " " + int + "." + dec;
	};

	var getSign = function (num) {
		return num < 0 ? "-" : "+";
	};

	var nodeListForEach = function (list, callback) {
		for (let i = 0; i < list.length; i++) callback(list[i], i);
	};

	return {
		getDOMstrings: function () {
			return DOMstrings;
		},

		getInput: function () {
			return {
				type: document.querySelector(DOMstrings.inputType).value,
				description: document.querySelector(DOMstrings.inputDescription).value,
				value: parseFloat(document.querySelector(DOMstrings.inputValue).value),
			};
		},

		addListItem: function (type, obj) {
			var html;

			// HTML markup
			html =
				type === "inc"
					? '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
					: '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">%percentage%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';

			// Replace %id%, %descriptiom%, %value% with data
			html = html.replace("%id%", obj.id);
			html = html.replace("%description%", obj.description);
			html = html.replace("%value%", formatNumber(type, obj.value));

			if (type === "inc")
				return document
					.querySelector(DOMstrings.incomeList)
					.insertAdjacentHTML("beforeend", html);
			document
				.querySelector(DOMstrings.expensesList)
				.insertAdjacentHTML("beforeend", html);
		},

		updateBudget: function (obj) {
			document.querySelector(
				DOMstrings.budgetIncome
			).textContent = formatNumber("inc", obj.income);
			document.querySelector(
				DOMstrings.budgetExpenses
			).textContent = formatNumber("exp", obj.expense);
			document.querySelector(DOMstrings.budget).textContent = formatNumber(
				undefined,
				obj.budget,
				getSign(obj.budget)
			);

			if (obj.percentage > 0)
				return (document.querySelector(
					DOMstrings.budgetPercentage
				).textContent = obj.percentage + "%");
			document.querySelector(DOMstrings.budgetPercentage).textContent = "---";
		},

		clearField: function () {
			var fields, fieldsArray;

			fields = document.querySelectorAll(
				DOMstrings.inputDescription + "," + DOMstrings.inputValue
			);

			fieldsArray = Array.prototype.slice.call(fields);
			fieldsArray.forEach(function (cur, index, array) {
				cur.value = "";
			});

			fieldsArray[0].focus();
		},

		displayPercentages: function (percentages) {
			var fields;

			fields = document.querySelectorAll(DOMstrings.expensesPercLabel);

			nodeListForEach(fields, function (current, index) {
				if (percentages[index] > 0)
					current.textContent = percentages[index] + "%";
				else current.textContent = "---";
			});
		},

		deleteListItem: function (itemID) {
			var el = document.getElementById(itemID);
			el.parentNode.removeChild(el);
		},

		changedType: function () {
			var fields = document.querySelectorAll(
				DOMstrings.inputType +
					"," +
					DOMstrings.inputDescription +
					"," +
					DOMstrings.inputValue
			);

			nodeListForEach(fields, function (cur) {
				cur.classList.toggle("red-focus");
			});

			document.querySelector(DOMstrings.addButton).classList.toggle("red");
		},

		displayMonth: function () {
			var now, month, year;
			var months = [
				"Jan",
				"Feb",
				"Mar",
				"May",
				"June",
				"July",
				"Aug",
				"Sep",
				"Oct",
				"Nov",
				"Dec",
			];

			now = new Date();
			month = now.getMonth();
			year = now.getFullYear();

			document.querySelector(DOMstrings.budgetTitle).textContent =
				months[month] + ", " + year;
		},
	};
})();

//  THE GLOBAL APP CONTROLLER

var controller = (function (budgetCtrl, UICtrl) {
	var DOM = UICtrl.getDOMstrings();

	var updateBudget = function () {
		var budget;
		// 1. Calculate the budget
		budgetCtrl.calculateBudget();

		// 2. Update the budget UI
		budget = budgetCtrl.getBudget();
		UICtrl.updateBudget(budget);
	};

	var updatePercentages = function () {
		var percentages;

		// 1. Calculate Percentage
		budgetCtrl.calculatePercentages();

		// 2. Display Percentages
		percentages = budgetCtrl.getPercentages();
		UICtrl.displayPercentages(percentages);
	};

	var ctrlAddItem = function () {
		var input, item;
		// 1. Read the Inputs
		input = UICtrl.getInput();

		// 2. Validate it
		if (input.type && input.description && input.value) {
			if (!budgetCtrl.validateInput(input)) return;

			// 3. Add item to the DS
			item = budgetCtrl.addItem(input);

			// 4. Update the List UI
			UICtrl.addListItem(input.type, item);

			// 5. clear the fields
			UICtrl.clearField();

			// 6. Update budget
			updateBudget();

			// 7. Update Percentages
			updatePercentages();
		}
	};

	var ctrlDeleteItem = function (event) {
		var itemID, splitID, type, id;

		itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
		if (itemID) {
			splitID = itemID.split("-");
			type = splitID[0];
			id = parseInt(splitID[1]);

			budgetCtrl.deleteItem(type, id);

			UICtrl.deleteListItem(itemID);

			updateBudget();

			updatePercentages();
		}
	};

	var setupEventHandler = function () {
		document
			.querySelector(DOM.addButton)
			.addEventListener("click", ctrlAddItem);
		document.addEventListener("keypress", function (event) {
			if (event.keyCode === 13 && event.which === 13) ctrlAddItem();
		});

		document
			.querySelector(DOM.container)
			.addEventListener("click", ctrlDeleteItem);

		document
			.querySelector(DOM.inputType)
			.addEventListener("change", UICtrl.changedType);
	};

	return {
		init: function () {
			UICtrl.displayMonth();

			UICtrl.updateBudget({
				income: 0,
				expense: 0,
				budget: 0,
				percentage: -1,
			});

			setupEventHandler();
		},
	};
})(budgetController, UIController);

controller.init();
