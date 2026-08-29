// --- INITIAL DATA SETUP ---
var defaultBooks = [
    {
        id: 1,
        title: 'Learn Web Dev',
        price: 29.99,
        image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=300'
    },
    {
        id: 2,
        title: 'JavaScript Essentials',
        price: 19.99,
        image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=300'
    }
];

var books = JSON.parse(localStorage.getItem('books')) || defaultBooks;
var cart = [];
var sales = JSON.parse(localStorage.getItem('sales')) || [];
var qrCodeUrl = localStorage.getItem('qrCode') || 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=DemoPayment';

function saveData() {
    localStorage.setItem('books', JSON.stringify(books));
    localStorage.setItem('sales', JSON.stringify(sales));
    localStorage.setItem('qrCode', qrCodeUrl);
}

// --- PAGE NAVIGATION ---
var isDashboard = false;
function toggleView() {
    isDashboard = !isDashboard;

    var homePage = document.getElementById('home-page');
    var dashboardPage = document.getElementById('dashboard-page');
    var navBtn = document.getElementById('nav-toggle');
    var appTitle = document.getElementById('app-title');

    if (isDashboard) {
        homePage.classList.remove('active');
        dashboardPage.classList.add('active');
        navBtn.innerText = "Go to Storefront";
        appTitle.innerText = "⚙️ Admin Dashboard";
        renderStatement();
        renderManageBooks();
    } else {
        dashboardPage.classList.remove('active');
        homePage.classList.add('active');
        navBtn.innerText = "Go to Dashboard";
        appTitle.innerText = "📚 BookStore";
    }
}

// --- STOREFRONT DISPLAY ---
function renderBooks() {
    var grid = document.getElementById('book-grid');
    if (!grid) return;

    grid.innerHTML = '';
    if (books.length === 0) {
        grid.innerHTML = '<p>No books available. Go to Dashboard to add some!</p>';
        return;
    }

    var i;
    for (i = 0; i < books.length; i++) {
        var book = books[i];
        var imgUrl = book.image ? book.image : 'https://via.placeholder.com/150?text=No+Image';

        grid.innerHTML += `
      <div class="book-card">
        <img src="${imgUrl}" alt="${book.title}" class="book-thumbnail">
        <h3>${book.title}</h3>
        <p>$${book.price.toFixed(2)}</p>
        <button class="btn" onclick="addToCart('${book.title}', ${book.price})">Add to Cart</button>
      </div>
    `;
    }
}

// --- CART & CHECKOUT ---
function addToCart(title, price) {
    cart.push({ title: title, price: price });
    renderCart();
}

function renderCart() {
    var cartTable = document.getElementById('cart-items');
    var totalEl = document.getElementById('cart-total');
    var checkoutSec = document.getElementById('checkout-section');

    cartTable.innerHTML = '';
    var total = 0;
    var i;

    for (i = 0; i < cart.length; i++) {
        var item = cart[i];
        total = total + item.price;
        cartTable.innerHTML += '<tr><td>' + item.title + '</td><td>$' + item.price.toFixed(2) + '</td></tr>';
    }

    totalEl.innerText = total.toFixed(2);

    if (cart.length > 0) {
        checkoutSec.style.display = 'block';
        document.getElementById('display-qr').src = qrCodeUrl;
    } else {
        checkoutSec.style.display = 'none';
    }
}

function completePurchase() {
    if (cart.length === 0) return;

    var total = 0;
    var itemNames = [];
    var i;

    for (i = 0; i < cart.length; i++) {
        total = total + cart[i].price;
        itemNames.push(cart[i].title);
    }

    var itemsBought = itemNames.join(', ');
    var date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    sales.push({ date: date, items: itemsBought, amount: total });
    saveData();

    alert('Payment Successful! Thank you for your purchase.');
    cart = [];
    renderCart();
}

// --- ADMIN DASHBOARD (ADD, EDIT, DELETE) ---
async function saveBook() {
    var titleInput = document.getElementById('book-title').value.trim();
    var priceInput = parseFloat(document.getElementById('book-price').value);
    var fileInput = document.getElementById('book-image-file').files[0];
    var urlInput = document.getElementById('book-image-url').value.trim();
    var editId = document.getElementById('edit-book-id').value;

    if (!titleInput || isNaN(priceInput)) {
        alert('Please enter a valid title and price!');
        return;
    }

    var imageUrl = '';

    // 1. Process uploaded file from computer if selected
    if (fileInput) {
        imageUrl = await convertFileToBase64(fileInput);
    }
    // 2. Otherwise use URL input
    else if (urlInput !== '') {
        imageUrl = urlInput;
    }
    // 3. If editing and no new image given, keep existing image
    else if (editId) {
        var i;
        for (i = 0; i < books.length; i++) {
            if (books[i].id == editId) {
                imageUrl = books[i].image;
                break;
            }
        }
    }

    // Update existing book or add new book
    if (editId) {
        var i;
        for (i = 0; i < books.length; i++) {
            if (books[i].id == editId) {
                books[i].title = titleInput;
                books[i].price = priceInput;
                books[i].image = imageUrl;
                break;
            }
        }
        alert('Book updated successfully!');
    } else {
        books.push({
            id: Date.now(),
            title: titleInput,
            price: priceInput,
            image: imageUrl
        });
        alert('Book added successfully!');
    }

    saveData();
    renderBooks();
    renderManageBooks();
    resetForm();
}

// Convert computer files into readable Data URLs
function convertFileToBase64(file) {
    return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.onerror = function (error) { reject(error); };
        reader.readAsDataURL(file);
    });
}

function startEditBook(id) {
    var book = null;
    var i;

    for (i = 0; i < books.length; i++) {
        if (books[i].id === id) {
            book = books[i];
            break;
        }
    }

    if (!book) return;

    document.getElementById('edit-book-id').value = book.id;
    document.getElementById('book-title').value = book.title;
    document.getElementById('book-price').value = book.price;
    document.getElementById('book-image-url').value = book.image.startsWith('data:') ? '' : book.image;

    document.getElementById('form-heading').innerText = 'Edit Book';
    document.getElementById('save-btn').innerText = 'Update Book';
    document.getElementById('cancel-btn').style.display = 'inline-block';

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteBook(id) {
    if (confirm('Are you sure you want to delete this book?')) {
        var updatedBooks = [];
        var i;

        for (i = 0; i < books.length; i++) {
            if (books[i].id !== id) {
                updatedBooks.push(books[i]);
            }
        }

        books = updatedBooks;
        saveData();
        renderBooks();
        renderManageBooks();
    }
}

function resetForm() {
    document.getElementById('edit-book-id').value = '';
    document.getElementById('book-title').value = '';
    document.getElementById('book-price').value = '';
    document.getElementById('book-image-file').value = '';
    document.getElementById('book-image-url').value = '';

    document.getElementById('form-heading').innerText = 'Add New Book';
    document.getElementById('save-btn').innerText = 'Add Item';
    document.getElementById('cancel-btn').style.display = 'none';
}

function renderManageBooks() {
    var list = document.getElementById('manage-books-list');
    if (!list) return;

    list.innerHTML = '';
    var i;

    for (i = 0; i < books.length; i++) {
        var book = books[i];
        var imgUrl = book.image ? book.image : 'https://via.placeholder.com/150?text=No+Image';
        list.innerHTML += `
      <tr>
        <td><img src="${imgUrl}" class="table-thumb" alt="thumb"></td>
        <td>${book.title}</td>
        <td>$${book.price.toFixed(2)}</td>
        <td>
          <button class="btn" onclick="startEditBook(${book.id})">Edit</button>
          <button class="btn btn-danger" onclick="deleteBook(${book.id})">Delete</button>
        </td>
      </tr>
    `;
    }
}

function updateQR() {
    var qrInput = document.getElementById('qr-url-input');
    if (qrInput.value.trim() !== '') {
        qrCodeUrl = qrInput.value.trim();
        saveData();
        alert('Payment QR Code updated!');
        qrInput.value = '';
    }
}

function renderStatement() {
    var statementList = document.getElementById('statement-list');
    if (!statementList) return;

    statementList.innerHTML = '';
    var i;

    for (i = 0; i < sales.length; i++) {
        var sale = sales[i];
        statementList.innerHTML += `
      <tr>
        <td>${sale.date}</td>
        <td>${sale.items}</td>
        <td>$${sale.amount.toFixed(2)}</td>
      </tr>
    `;
    }
}

// --- INITIALIZE PAGE ---
saveData();
renderBooks();
