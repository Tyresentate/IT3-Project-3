// PatientInfo.js
document.addEventListener('DOMContentLoaded', function() {
    const loggedUser = JSON.parse(localStorage.getItem('loggedUser') || '{}');
    
    if (!loggedUser.id || !loggedUser.doctorId) {
        alert('Access denied. Please login as a doctor.');
        window.location.href = 'login.html';
        return;
    }
    
    const doctorNameElement = document.getElementById('doctorNameDisplay');
    if (doctorNameElement && loggedUser.firstName) {
        doctorNameElement.textContent = `Dr. ${loggedUser.firstName} ${loggedUser.lastName}`;
    }

    // Initialize application
    initPatientInfo();
});

function initPatientInfo() {
    // Elements
    const patientSelect = document.getElementById('patientSelect');
    const loadPatientBtn = document.getElementById('loadPatientBtn');
    const editPatientBtn = document.getElementById('editPatientBtn');
    const displayEditBtn = document.getElementById('displayEditBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const patientInfoForm = document.getElementById('patientInfoForm');
    const patientDisplay = document.getElementById('patientDisplay');

    let currentPatientId = null;
    let currentPatientData = null;

    // Load patients list
    loadPatients();

    // Initialize toggle sections
    initToggleSections();

    // Event listeners
    loadPatientBtn.addEventListener('click', handleLoadPatient);
    editPatientBtn.addEventListener('click', handleEditPatient);
    displayEditBtn.addEventListener('click', handleEditPatient);
    cancelBtn.addEventListener('click', handleCancelEdit);
    patientInfoForm.addEventListener('submit', handleFormSubmit);
    patientSelect.addEventListener('change', handlePatientSelectChange);

    // Modal handlers
    initModals();

    function loadPatients() {
        fetch('http://localhost:3000/patients')
            .then(res => {
                if (!res.ok) throw new Error('Failed to load patients');
                return res.json();
            })
            .then(patients => {
                patientSelect.innerHTML = '<option value="">-- Choose a Patient --</option>';
                patients.forEach(patient => {
                    const option = document.createElement('option');
                    option.value = patient.user_id;
                    option.textContent = `${patient.first_name} ${patient.last_name} - ${patient.email}`;
                    patientSelect.appendChild(option);
                });
                
                if (patients.length === 0) {
                    patientSelect.innerHTML = '<option value="">No patients found in system</option>';
                }
            })
            .catch(err => {
                console.error('Error loading patients:', err);
                patientSelect.innerHTML = '<option value="">Error loading patients</option>';
            });
    }

    function handleLoadPatient() {
        const selectedPatientId = patientSelect.value;
        if (!selectedPatientId) {
            alert('Please select a patient first.');
            return;
        }
        currentPatientId = selectedPatientId;
        loadPatientInfo(selectedPatientId);
    }

    function handleEditPatient() {
        showFormView();
        if (currentPatientData) {
            fillFormWithPatientData(currentPatientData);
        }
    }

    function handleCancelEdit() {
        if (currentPatientData && currentPatientData.info) {
            showDisplayView();
            displayPatientData(currentPatientData);
        } else {
            // If no data exists, stay in form view for new entry
            clearForm();
            loadPatientBasicInfo(currentPatientId);
        }
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        savePatientInfo();
    }

    function handlePatientSelectChange() {
        const selectedPatientId = patientSelect.value;
        if (selectedPatientId) {
            editPatientBtn.style.display = 'inline-block';
        } else {
            editPatientBtn.style.display = 'none';
            patientInfoForm.style.display = 'block';
            patientDisplay.style.display = 'none';
            clearForm();
        }
    }

    function loadPatientInfo(patientId) {
        fetch(`http://localhost:3000/patient/${patientId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load patient info');
                return res.json();
            })
            .then(patient => {
                currentPatientData = patient;
                
                if (patient.info) {
                    // Patient has existing info - show display view
                    showDisplayView();
                    displayPatientData(patient);
                } else {
                    // No existing info - show form for new entry
                    showFormView();
                    loadPatientBasicInfo(patientId);
                }
            })
            .catch(err => {
                console.error('Error loading patient info:', err);
                alert('Error loading patient information.');
            });
    }

    function loadPatientBasicInfo(patientId) {
        fetch(`http://localhost:3000/patient/${patientId}`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load patient info');
                return res.json();
            })
            .then(patient => {
                // Fill basic info (read-only fields)
                document.getElementById('patientFullName').value = `${patient.first_name} ${patient.last_name}`;
                document.getElementById('patientPhone').value = patient.phone || '';
                document.getElementById('patientEmail').value = patient.email || '';
                document.getElementById('patientAge').value = patient.age || '';
            })
            .catch(err => {
                console.error('Error loading patient basic info:', err);
            });
    }

    function fillFormWithPatientData(patient) {
        // Basic info
        document.getElementById('patientFullName').value = `${patient.first_name} ${patient.last_name}`;
        document.getElementById('patientPhone').value = patient.phone || '';
        document.getElementById('patientEmail').value = patient.email || '';
        document.getElementById('patientAge').value = patient.age || '';

        // Patient info fields
        if (patient.info) {
            const info = patient.info;
            document.getElementById('patientGender').value = info.gender || '';
            document.getElementById('patientLanguage').value = info.language || '';
            document.getElementById('patientHeight').value = info.height || '';
            document.getElementById('patientWeight').value = info.weight || '';
            document.getElementById('patientEthnicity').value = info.ethnicity || '';
            document.getElementById('patientAddress').value = info.address || '';
            document.getElementById('allergies').value = info.allergies || '';
            document.getElementById('medicalNotes').value = info.medical_notes || '';
            document.getElementById('deliveryType').value = info.delivery_type || '';
            document.getElementById('drugLine1').value = info.drug_line_1 || '';
            document.getElementById('drugLine2').value = info.drug_line_2 || '';
            
            // Medication details
            document.getElementById('drugBrand1').value = info.drug_brand_1 || '';
            document.getElementById('drugGeneric1').value = info.drug_generic_1 || '';
            document.getElementById('drugDosage1').value = info.drug_dosage_1 || '';
            document.getElementById('drugPack1').value = info.drug_pack_1 || '';
            document.getElementById('drugForm1').value = info.drug_form_1 || '';
            document.getElementById('drugManufacturer1').value = info.drug_manufacturer_1 || '';
            
            document.getElementById('drugBrand2').value = info.drug_brand_2 || '';
            document.getElementById('drugGeneric2').value = info.drug_generic_2 || '';
            document.getElementById('drugDosage2').value = info.drug_dosage_2 || '';
            document.getElementById('drugPack2').value = info.drug_pack_2 || '';
            document.getElementById('drugForm2').value = info.drug_form_2 || '';
            document.getElementById('drugManufacturer2').value = info.drug_manufacturer_2 || '';
            
            document.getElementById('drugBrand3').value = info.drug_brand_3 || '';
            document.getElementById('drugGeneric3').value = info.drug_generic_3 || '';
            document.getElementById('drugDosage3').value = info.drug_dosage_3 || '';
            document.getElementById('drugPack3').value = info.drug_pack_3 || '';
            document.getElementById('drugForm3').value = info.drug_form_3 || '';
            document.getElementById('drugManufacturer3').value = info.drug_manufacturer_3 || '';
        }
    }

    function displayPatientData(patient) {
        // Update display elements
        document.getElementById('displayFullName').textContent = `${patient.first_name} ${patient.last_name}`;
        document.getElementById('displayPhone').textContent = patient.phone || 'Not specified';
        document.getElementById('displayEmail').textContent = patient.email || 'Not specified';
        document.getElementById('displayAge').textContent = patient.age || 'Not specified';

        if (patient.info) {
            const info = patient.info;
            document.getElementById('displayGender').textContent = info.gender || 'Not specified';
            document.getElementById('displayLanguage').textContent = info.language || 'Not specified';
            document.getElementById('displayHeight').textContent = info.height || 'Not specified';
            document.getElementById('displayWeight').textContent = info.weight || 'Not specified';
            document.getElementById('displayEthnicity').textContent = info.ethnicity || 'Not specified';
            document.getElementById('displayAddress').textContent = info.address || 'Not specified';
            document.getElementById('displayDeliveryType').textContent = info.delivery_type || 'Not specified';
            document.getElementById('displayDrugLine1').textContent = info.drug_line_1 || 'Not specified';
            document.getElementById('displayDrugLine2').textContent = info.drug_line_2 || 'Not specified';
            document.getElementById('displayMedicalNotes').textContent = info.medical_notes || 'No medical notes available';

            // Allergies
            const allergyList = document.getElementById('displayAllergyList');
            allergyList.innerHTML = '';
            if (info.allergies) {
                const allergies = info.allergies.split(',').map(allergy => allergy.trim());
                allergies.forEach(allergy => {
                    if (allergy) {
                        const li = document.createElement('li');
                        li.textContent = allergy;
                        allergyList.appendChild(li);
                    }
                });
            }
            if (allergyList.children.length === 0) {
                allergyList.innerHTML = '<li>No allergies recorded</li>';
            }

            // Medications
            document.getElementById('displayDrugBrand1').textContent = info.drug_brand_1 || '-';
            document.getElementById('displayDrugGeneric1').textContent = info.drug_generic_1 || '-';
            document.getElementById('displayDrugDosage1').textContent = info.drug_dosage_1 || '-';
            document.getElementById('displayDrugPack1').textContent = info.drug_pack_1 || '-';
            document.getElementById('displayDrugForm1').textContent = info.drug_form_1 || '-';
            document.getElementById('displayDrugManufacturer1').textContent = info.drug_manufacturer_1 || '-';
            
            document.getElementById('displayDrugBrand2').textContent = info.drug_brand_2 || '-';
            document.getElementById('displayDrugGeneric2').textContent = info.drug_generic_2 || '-';
            document.getElementById('displayDrugDosage2').textContent = info.drug_dosage_2 || '-';
            document.getElementById('displayDrugPack2').textContent = info.drug_pack_2 || '-';
            document.getElementById('displayDrugForm2').textContent = info.drug_form_2 || '-';
            document.getElementById('displayDrugManufacturer2').textContent = info.drug_manufacturer_2 || '-';
            
            document.getElementById('displayDrugBrand3').textContent = info.drug_brand_3 || '-';
            document.getElementById('displayDrugGeneric3').textContent = info.drug_generic_3 || '-';
            document.getElementById('displayDrugDosage3').textContent = info.drug_dosage_3 || '-';
            document.getElementById('displayDrugPack3').textContent = info.drug_pack_3 || '-';
            document.getElementById('displayDrugForm3').textContent = info.drug_form_3 || '-';
            document.getElementById('displayDrugManufacturer3').textContent = info.drug_manufacturer_3 || '-';
        }
    }

    function savePatientInfo() {
        const formData = new FormData(patientInfoForm);
        const patientData = {
            userId: currentPatientId,
            gender: formData.get('gender'),
            language: formData.get('language'),
            height: formData.get('height'),
            weight: formData.get('weight'),
            ethnicity: formData.get('ethnicity'),
            address: formData.get('address'),
            allergies: formData.get('allergies'),
            medicalNotes: formData.get('medicalNotes'),
            deliveryType: formData.get('deliveryType'),
            drugLine1: formData.get('drugLine1'),
            drugLine2: formData.get('drugLine2'),
            drugBrand1: formData.get('drugBrand1'),
            drugGeneric1: formData.get('drugGeneric1'),
            drugDosage1: formData.get('drugDosage1'),
            drugPack1: formData.get('drugPack1'),
            drugForm1: formData.get('drugForm1'),
            drugManufacturer1: formData.get('drugManufacturer1'),
            drugBrand2: formData.get('drugBrand2'),
            drugGeneric2: formData.get('drugGeneric2'),
            drugDosage2: formData.get('drugDosage2'),
            drugPack2: formData.get('drugPack2'),
            drugForm2: formData.get('drugForm2'),
            drugManufacturer2: formData.get('drugManufacturer2'),
            drugBrand3: formData.get('drugBrand3'),
            drugGeneric3: formData.get('drugGeneric3'),
            drugDosage3: formData.get('drugDosage3'),
            drugPack3: formData.get('drugPack3'),
            drugForm3: formData.get('drugForm3'),
            drugManufacturer3: formData.get('drugManufacturer3')
        };

        fetch('http://localhost:3000/patient-info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patientData)
        })
        .then(res => {
            if (!res.ok) throw new Error('Failed to save patient info');
            return res.json();
        })
        .then(result => {
            document.getElementById('successMessage').textContent = result.message;
            document.getElementById('successModal').style.display = 'flex';
            
            // Reload the patient info to show updated data
            loadPatientInfo(currentPatientId);
        })
        .catch(err => {
            console.error('Error saving patient info:', err);
            alert('Error saving patient information.');
        });
    }

    function showFormView() {
        patientInfoForm.style.display = 'block';
        patientDisplay.style.display = 'none';
        document.getElementById('cancelBtn').style.display = 'inline-block';
    }

    function showDisplayView() {
        patientInfoForm.style.display = 'none';
        patientDisplay.style.display = 'block';
        document.getElementById('cancelBtn').style.display = 'none';
    }

    function clearForm() {
        const form = document.getElementById('patientInfoForm');
        const inputs = form.querySelectorAll('input:not([readonly]), select, textarea');
        inputs.forEach(input => {
            if (input.type !== 'submit' && input.type !== 'button') {
                if (input.tagName === 'SELECT') {
                    input.selectedIndex = 0;
                } else {
                    input.value = '';
                }
            }
        });
    }

    function initToggleSections() {
        document.querySelectorAll(".toggle-header").forEach(header => {
            header.addEventListener("click", () => {
                const content = header.nextElementSibling;
                content.style.display = content.style.display === "block" ? "none" : "block";
                header.textContent = header.textContent.includes("⯆")
                    ? header.textContent.replace("⯆", "⯅")
                    : header.textContent.replace("⯅", "⯆");
            });
        });
    }

    function initModals() {
        const logoutBtn = document.getElementById("logoutBtn");
        const logoutModal = document.getElementById("logoutModal");
        const confirmLogout = document.getElementById("confirmLogout");
        const cancelLogout = document.getElementById("cancelLogout");
        const successModal = document.getElementById("successModal");
        const closeSuccess = document.getElementById("closeSuccess");

        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            logoutModal.style.display = "flex";
        });

        cancelLogout.addEventListener("click", () => {
            logoutModal.style.display = "none";
        });

        confirmLogout.addEventListener("click", () => {
            localStorage.removeItem('loggedUser');
            window.location.href = "index.html";
        });

        closeSuccess.addEventListener("click", () => {
            successModal.style.display = "none";
        });

        window.addEventListener("click", (e) => {
            if (e.target === logoutModal) {
                logoutModal.style.display = "none";
            }
            if (e.target === successModal) {
                successModal.style.display = "none";
            }
        });
    }
}