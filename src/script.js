// Referencias al DOM (CRUD)
const userForm = document.getElementById('userForm');
const tableBody = document.getElementById('usersTableBody');
const editIndexInput = document.getElementById('editIndex');
const submitBtn = document.getElementById('submitBtn');
const cancelBtn = document.getElementById('cancelBtn');

// Referencias al DOM (Login y Logout)
const loginForm = document.getElementById('loginForm');
const loginResult = document.getElementById('loginResult');
const loginContainer = document.getElementById('loginContainer');
const crudContainer = document.getElementById('crudContainer');
const logoutBtn = document.getElementById('logoutBtn'); // <--- Nueva referencia

// Inicializar array de usuarios desde localStorage (o array vacío si no hay nada)
let users = JSON.parse(localStorage.getItem('usersDB')) || [];

// Verificamos si existe el usuario "admin" específicamente
const adminExists = users.find(u => u.username === 'admin');

// Si no existe el admin, lo inyectamos conservando a los demás usuarios
if (!adminExists) {
    users.push({
        username: 'admin',
        role: 'Admin',
        passwordRaw: 'admin',
        // Hash SHA-256 precalculado de la palabra "admin"
        passwordHashed: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' 
    });
    localStorage.setItem('usersDB', JSON.stringify(users));
}

// Función nativa para simular el "encriptado" usando un Hash SHA-256
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// LOGICA DE INICIO DE SESIÓN
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const loginUser = document.getElementById('loginUser').value;
    const loginPass = document.getElementById('loginPass').value;
    
    const userFound = users.find(u => u.username === loginUser);
    
    if (!userFound) {
        loginResult.style.color = '#dc3545';
        loginResult.textContent = '❌ El usuario no existe.';
        return;
    }
    
    const hashedAttempt = await hashPassword(loginPass);
    
    if (hashedAttempt === userFound.passwordHashed) {
        loginResult.style.color = '#28a745';
        
        if (userFound.role === 'Admin') {
            loginResult.innerHTML = `✅ ¡Acceso concedido! Bienvenido Administrador <strong>${userFound.username}</strong>.`;
        } else {
            loginResult.innerHTML = `✅ ¡Acceso concedido! Bienvenido <strong>${userFound.username}</strong>. Eres un Usuario Normal (Solo lectura).`;
        }
        
        // Pausa de 1.5 segundos antes de cambiar de pantalla
        setTimeout(() => {
            loginContainer.style.display = 'none';
            crudContainer.style.display = 'block';

            if (userFound.role === 'Admin') {
                // El Admin ve todo el formulario para crear
                document.getElementById('userForm').style.display = 'block';
                
                // Asegurarnos de que los botones de acción estén visibles (por si un usuario normal entró antes)
                const actionButtons = document.querySelectorAll('.btn-edit, .btn-delete');
                actionButtons.forEach(btn => btn.style.display = 'inline-block');
                
            } else {
                // El Usuario Normal solo ve la tabla (modo lectura)
                document.getElementById('userForm').style.display = 'none';
                
                // Ocultar los botones de "Editar/Eliminar" en la tabla
                const actionButtons = document.querySelectorAll('.btn-edit, .btn-delete');
                actionButtons.forEach(btn => btn.style.display = 'none');
            }
        }, 1500); 

    } else {
        loginResult.style.color = '#dc3545';
        loginResult.textContent = '❌ Contraseña incorrecta.';
    }
});

// LOGICA DEL CRUD (CREATE / UPDATE)
userForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const passwordRaw = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const editIndex = editIndexInput.value;

    const passwordHashed = await hashPassword(passwordRaw);

    const userData = { username, role, passwordRaw, passwordHashed };

    if (editIndex === '') {
        users.push(userData);
    } else {
        users[editIndex] = userData;
        resetForm();
    }

    saveAndRender();
    userForm.reset();
});

// READ (Renderizar tabla)
function renderTable() {
    tableBody.innerHTML = '';
    
    users.forEach((user, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.username}</td>
            <td><strong>${user.role}</strong></td>
            <td>${user.passwordRaw}</td>
            <td class="hash-text">${user.passwordHashed.substring(0, 20)}...</td>
            <td>
                <button class="btn-edit" onclick="editUser(${index})">Editar</button>
                <button class="btn-delete" onclick="deleteUser(${index})">Eliminar</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

// UPDATE (Cargar datos al formulario)
window.editUser = function(index) {
    const user = users[index];
    document.getElementById('username').value = user.username;
    document.getElementById('password').value = user.passwordRaw;
    document.getElementById('role').value = user.role;
    editIndexInput.value = index;
    
    submitBtn.textContent = 'Actualizar Usuario';
    cancelBtn.style.display = 'inline-block';
}

// DELETE (Eliminar usuario)
window.deleteUser = function(index) {
    if(confirm('¿Seguro que deseas eliminar este usuario?')) {
        users.splice(index, 1);
        saveAndRender();
    }
}

function saveAndRender() {
    localStorage.setItem('usersDB', JSON.stringify(users));
    renderTable();
}

function resetForm() {
    editIndexInput.value = '';
    submitBtn.textContent = 'Crear Usuario';
    cancelBtn.style.display = 'none';
    userForm.reset();
}

cancelBtn.addEventListener('click', resetForm);

// LÓGICA DE CERRAR SESIÓN
logoutBtn.addEventListener('click', () => {
    // 1. Ocultar el panel de administración
    crudContainer.style.display = 'none';
    
    // 2. Mostrar el panel de login
    loginContainer.style.display = 'block';
    
    // 3. Limpiar los campos y el mensaje de éxito del login anterior
    loginForm.reset();
    loginResult.textContent = '';
    
    // 4. Resetear el formulario de creación por si se quedó a medias
    resetForm();
});

// Renderizar la tabla por primera vez al cargar
renderTable();