document.addEventListener('DOMContentLoaded', () => {
    const personForm = document.getElementById('personForm');
    const addWorkBtn = document.getElementById('addWorkBtn');
    const peopleContainer = document.getElementById('peopleContainer');
    const formTitle = document.getElementById('formTitle');
    const submitBtn = document.getElementById('submitBtn');

    let editingPersonId = null;

    const fetchPersons = async () => {
        try {
            const response = await fetch('/api/persons');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const persons = await response.json();
            console.log('Fetched persons:', persons);

            if (!Array.isArray(persons)) {
                console.error('Fetched data is not an array:', persons);
                throw new Error('Fetched data is not in the expected format');
            }

            peopleContainer.innerHTML = persons.map(person => {
                console.log('Processing person:', person);
                return createPersonCard(person);
            }).join('');
        } catch (error) {
            console.error('Error fetching persons:', error);
            peopleContainer.innerHTML = '<p>Error loading persons. Please try again.</p>';
        }
    };

    const createPersonCard = (person) => {
        console.log('Creating card for person:', person);
        if (!person || typeof person !== 'object') {
            console.error('Invalid person data:', person);
            return '<div class="bg-white p-4 rounded-lg shadow">Invalid person data</div>';
        }

        // Verificar la estructura de los trabajos
        let works = [];
        if (Array.isArray(person.works)) {
            works = person.works;
        } else if (person.Works && Array.isArray(person.Works)) {
            works = person.Works;
        } else if (typeof person.works === 'object' && person.works !== null) {
            works = Object.values(person.works);
        }

        console.log(`Works for person ${person.id}:`, works);

        const worksHtml = works.length > 0
            ? works.map(work => `
                <li>
                    ${work.company || 'N/A'} - ${work.position || 'N/A'}
                    (${work.initContract ? new Date(work.initContract).toLocaleDateString() : 'N/A'} to
                     ${work.finishContract ? new Date(work.finishContract).toLocaleDateString() : 'N/A'})
                    <button onclick="editWork(${person.id}, ${work.id})" class="text-blue-500 ml-2">Edit</button>
                    <button onclick="deleteWork(${person.id}, ${work.id})" class="text-red-500 ml-2">Delete</button>
                </li>
            `).join('')
            : '<li>No works available</li>';

        return `
            <div class="bg-white p-4 rounded-lg shadow">
                <h3 class="text-lg font-semibold">${person.name || 'N/A'} ${person.lastName || 'N/A'}</h3>
                <p>Nationality: ${person.nationality || 'N/A'}</p>
                <p>Year: ${person.year || 'N/A'}</p>
                <h4 class="font-semibold mt-2">Works:</h4>
                <ul class="list-disc pl-5">
                    ${worksHtml}
                </ul>
                <div class="mt-4">
                    <button onclick="editPerson(${person.id})" class="bg-yellow-500 text-white p-2 rounded mr-2">Edit</button>
                    <button onclick="deletePerson(${person.id})" class="bg-red-500 text-white p-2 rounded">Delete</button>
                </div>
            </div>
        `;
    };

    // Handle form submission (create or update person)
    personForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(personForm);
        const personData = {
            name: formData.get('name'),
            lastName: formData.get('lastName'),
            nationality: formData.get('nationality'),
            year: parseInt(formData.get('year')),
            works: Array.from(document.querySelectorAll('.work-item')).map(workItem => ({
                company: workItem.querySelector('[name="company"]').value,
                position: workItem.querySelector('[name="position"]').value,
                initContract: workItem.querySelector('[name="initContract"]').value,
                finishContract: workItem.querySelector('[name="finishContract"]').value
            }))
        };

        console.log('Sending person data:', JSON.stringify(personData, null, 2));

        try {
            const url = editingPersonId ? `/api/persons/${editingPersonId}` : '/api/persons';
            const method = editingPersonId ? 'PUT' : 'POST';
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(personData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(`HTTP error! status: ${response.status}, message: ${JSON.stringify(errorData)}`);
            }

            const result = await response.json();
            console.log('Server response:', result);

            await fetchPersons();
            resetForm();
            alert(`Person ${editingPersonId ? 'updated' : 'created'} successfully!`);
        } catch (error) {
            console.error('Error saving person:', error);
            alert(`Error saving person: ${error.message}`);
        }
    });

    // Add new work field
    addWorkBtn.addEventListener('click', () => addWorkField());

    // Function to add a new work field
    const addWorkField = (work = {}) => {
        const workId = work.id || Date.now();
        const workHtml = `
            <div class="work-item mt-2 p-2 border rounded" data-work-id="${workId}">
                <input type="text" name="company" value="${work.company || ''}" placeholder="Company" class="p-1 border rounded">
                <input type="text" name="position" value="${work.position || ''}" placeholder="Position" class="p-1 border rounded">
                <input type="date" name="initContract" value="${work.initContract ? work.initContract.split('T')[0] : ''}" class="p-1 border rounded">
                <input type="date" name="finishContract" value="${work.finishContract ? work.finishContract.split('T')[0] : ''}" class="p-1 border rounded">
                <button type="button" onclick="this.parentElement.remove()" class="bg-red-500 text-white p-1 rounded">Remove</button>
            </div>
        `;
        document.getElementById('worksList').insertAdjacentHTML('beforeend', workHtml);
    };

    // Edit person
    window.editPerson = async (id) => {
        try {
            const response = await fetch(`/api/persons/${id}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const person = await response.json();

            document.getElementById('personId').value = person.id;
            document.getElementById('name').value = person.name;
            document.getElementById('lastName').value = person.lastName;
            document.getElementById('nationality').value = person.nationality;
            document.getElementById('year').value = person.year;

            document.getElementById('worksList').innerHTML = '';
            person.works.forEach(work => addWorkField(work));

            editingPersonId = id;
            formTitle.textContent = 'Edit Person';
            submitBtn.textContent = 'Update Person';
        } catch (error) {
            console.error('Error fetching person for edit:', error);
            alert('Error loading person data. Please try again.');
        }
    };

    // Delete person
    window.deletePerson = async (id) => {
        if (confirm('Are you sure you want to delete this person?')) {
            try {
                const response = await fetch(`/api/persons/${id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                await fetchPersons();
                alert('Person deleted successfully!');
            } catch (error) {
                console.error('Error deleting person:', error);
                alert('Error deleting person. Please try again.');
            }
        }
    };

    // Edit work
    window.editWork = async (personId, workId) => {
        try {
            const response = await fetch(`/api/persons/${personId}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const person = await response.json();
            const work = person.works.find(w => w.id === workId);

            if (work) {
                editPerson(personId);
                setTimeout(() => {
                    const workItem = document.querySelector(`.work-item[data-work-id="${workId}"]`);
                    if (workItem) {
                        workItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        workItem.classList.add('bg-yellow-100');
                        setTimeout(() => workItem.classList.remove('bg-yellow-100'), 2000);
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error fetching work for edit:', error);
            alert('Error loading work data. Please try again.');
        }
    };

    // Delete work
    window.deleteWork = async (personId, workId) => {
        if (confirm('Are you sure you want to delete this work?')) {
            try {
                const response = await fetch(`/api/persons/${personId}/works/${workId}`, { method: 'DELETE' });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                await fetchPersons();
                alert('Work deleted successfully!');
            } catch (error) {
                console.error('Error deleting work:', error);
                alert('Error deleting work. Please try again.');
            }
        }
    };

    // Reset form
    const resetForm = () => {
        personForm.reset();
        document.getElementById('worksList').innerHTML = '';
        editingPersonId = null;
        formTitle.textContent = 'Add New Person';
        submitBtn.textContent = 'Save Person';
    };

    // Initial fetch of persons
    fetchPersons();
});
