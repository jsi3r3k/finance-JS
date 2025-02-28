document.addEventListener('DOMContentLoaded', () => {
    const transactionForm = document.getElementById('transaction-form');
    const transactionList = document.getElementById('transaction-list');
    const summaryElement = document.getElementById('summary');
    const categoryTypeSelect = document.getElementById('category-type');
    const categorySelect = document.getElementById('category');
    const newCategoryInput = document.getElementById('new-category');
    const ctx = document.getElementById('myChart').getContext('2d');

    let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
    let categories = JSON.parse(localStorage.getItem('categories')) || {
        income: ['Wypłata', 'Oszczędności', 'Inwestycje'],
        expense: ['Fryzjer', 'Jedzenie', 'Mieszkanie']
    };

    let chart;

    const saveTransactions = () => {
        localStorage.setItem('transactions', JSON.stringify(transactions));
    };

    const saveCategories = () => {
        localStorage.setItem('categories', JSON.stringify(categories));
    };

    const updateCategoryOptions = () => {
        const selectedType = categoryTypeSelect.value;
        categorySelect.innerHTML = '';
        categories[selectedType].forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    };

    categoryTypeSelect.addEventListener('change', updateCategoryOptions);

    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const description = document.getElementById('description').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const categoryType = categoryTypeSelect.value;
        const category = newCategoryInput.value.trim() || categorySelect.value;

        if (newCategoryInput.value.trim() && !categories[categoryType].includes(newCategoryInput.value.trim())) {
            categories[categoryType].push(newCategoryInput.value.trim());
            saveCategories();
            updateCategoryOptions();
        }

        const transaction = {
            description,
            amount,
            category,
            categoryType
        };

        transactions.push(transaction);
        saveTransactions();
        updateTransactions();
        updateSummary();
        updateChart();

        transactionForm.reset();
        updateCategoryOptions();
    });

    function updateTransactions() {
        transactionList.innerHTML = '';

        transactions.forEach((transaction, index) => {
            const li = document.createElement('li');
            li.classList.add(transaction.categoryType);
            li.innerHTML = `
                ${transaction.description} - ${transaction.amount.toFixed(2)}ZŁ (${transaction.category})
                <button onclick="removeTransaction(${index})" class="remove-btn">Remove</button>
            `;
            transactionList.appendChild(li);
        });
    }

    function updateSummary() {
        const income = transactions
            .filter(transaction => transaction.categoryType === 'income')
            .reduce((sum, transaction) => sum + transaction.amount, 0);

        const expense = transactions
            .filter(transaction => transaction.categoryType === 'expense')
            .reduce((sum, transaction) => sum + transaction.amount, 0);

        const balance = income - expense;

        summaryElement.textContent = `
            Wpływy: ZŁ${income.toFixed(2)} | Wydatki: ZŁ${expense.toFixed(2)} | Stan konta: ZŁ${balance.toFixed(2)}
        `;
    }

    window.removeTransaction = (index) => {
        transactions.splice(index, 1);
        saveTransactions();
        updateTransactions();
        updateSummary();
        updateChart();
    };

    function updateChart() {
        const expenseCategories = transactions
            .filter(transaction => transaction.categoryType === 'expense')
            .reduce((acc, transaction) => {
                acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
                return acc;
            }, {});

        const incomeCategories = transactions
            .filter(transaction => transaction.categoryType === 'income')
            .reduce((acc, transaction) => {
                acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
                return acc;
            }, {});

        const expenseData = {
            labels: Object.keys(expenseCategories),
            datasets: [{
                data: Object.values(expenseCategories),
                backgroundColor: ['#FFB6C1', '#FF69B4', '#FF1493', '#DB7093', '#C71585'],
                hoverOffset: 4
            }]
        };

        const incomeData = {
            labels: Object.keys(incomeCategories),
            datasets: [{
                data: Object.values(incomeCategories),
                backgroundColor: ['#ADD8E6', '#87CEEB', '#4682B4', '#1E90FF', '#0000FF'],
                hoverOffset: 4
            }]
        };

        const data = {
            labels: [...Object.keys(expenseCategories), ...Object.keys(incomeCategories)],
            datasets: [{
                label: 'Wydatki i Wpływy',
                data: [...Object.values(expenseCategories), ...Object.values(incomeCategories)],
                backgroundColor: [
                    ...['#FFB6C1', '#FF69B4', '#FF1493', '#DB7093', '#C71585'],
                    ...['#ADD8E6', '#87CEEB', '#4682B4', '#1E90FF', '#0000FF']
                ],
                hoverOffset: 4
            }]
        };

        if (chart) {
            chart.destroy();
        }

        chart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                return `${label}: ZŁ${value.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    updateTransactions();
    updateSummary();
    updateCategoryOptions();
    updateChart();
});