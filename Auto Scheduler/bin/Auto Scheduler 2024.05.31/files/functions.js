//-----------------------------

/* global data */ {
    var month = [];
    var residents = [];
    var blueTeam = [];
    var redTeam = [];
    var eduTeam = [];
    var positions = ['blueChief', 'blueStaff', 'redChief', 'redStaff', 'consult', 'nightSr', 'nightJr'];
    var shiftTypes = ['shifts', 'consults', 'weekends', 'nights'];
    var stats = [];
    var halfway = false;
}

//-----------------------------

class Resident {

    constructor(argName, argPGY) {

        this.name = argName;
        this.PGY = argPGY;

        this.team = '---';
        this.availability = [1, 1, 1, 1];

        for (let shiftType of shiftTypes) {
            this[shiftType] = [0, 0, 0, 0];
        }
    }

    _shifts() {
        var total = 0;
        for (let subtotal of this.shifts) {
            total += subtotal;
        }
        return total;
    }
    _consults() {
        var total = 0;
        for (let subtotal of this.consults) {
            total += subtotal;
        }
        return total;
    }
    _weekends() {
        var total = 0;
        for (let subtotal of this.weekends) {
            total += subtotal;
        }
        return total;
    }
    _nights() {
        var total = 0;
        for (let subtotal of this.nights) {
            total += subtotal;
        }
        return total;
    }
    _availability() {
        var total = 0;
        for (let subtotal of this.availability) {
            total += subtotal;
        }
        return total;
    }

    canChief() {
        if (this.PGY == 5) return true;
        else return false;
    }
    canChiefWeekend() {

        if (this.PGY == 4) return true;
        if (this.PGY == 5 && this.team == 'edu') return true;

        else return false;
    }
    canNightSr() {

        //allow PGY 2 if halfway
        if (halfway && this.PGY == 2) return true;

        //otherwise PGY 3-5
        if (this.PGY > 2) return true;
        else return false;
    }
    canNightJr() {

        if (this.PGY < 4) return true;
        else return false;
    }
    canConsult() {

        //allow PGY 1 if halfway
        if (halfway && this.PGY == 1) return true;

        //otherwise only PGY 2-4
        if (this.PGY > 1 && this.PGY < 5) return true;
        else return false;
    }
    canSr() {

        if (this.PGY > 2) return true;
        else return false;
    }
    canJr() {

        //PGY 1-4
        if (this.PGY < 5) return true;

        //only PGY 1 & 2
        //if (this.PGY < 3) return true;
        
        else return false;
    }


    isAvailableDay(day) {

        //1. check if on vacation
        if (this.isOnVacation(day)) return false;

        //2. check if working during the day
        if (this.isWorkingDay(day)) return false;

        //3. check if working yesterday night (only on Sat/Sun to prevent bug on day 0)
        if (day.isSatSun()) {
            if (this.isWorkingNight(day.yesterday())) return false;
        }

        //free if none of the conditions above
        return true;
    }
    isAvailableNight(day) {

        //1. check if on vacation
        if (this.isOnVacation(day)) return false;

        //2. check if already working tonight
        if (this.isWorkingNight(day)) return false;

        //3. check if working yesterday night (only on Sat/Sun to prevent bug on day 0)
        if (day.isSatSun()) {
            if (this.isWorkingNight(day.yesterday())) return false;
        }

        //4. check if working tomorrow at all (only Fri/Sat to prevent bug on day 28)
        if (day.isFriSat()) {
            if (this.isWorking(day.tomorrow())) return false;
        }

        //is available if none of the conditions above
        return true;
    }
    isWorking(day) {

        if (this.isWorkingDay(day)) return true;
        if (this.isWorkingNight(day)) return true;
        return false;
    }
    isWorkingDay(day) {

        //check if working any day shift
        if (day.blueChief.includes(this)) return true;
        if (day.blueStaff.includes(this)) return true;
        if (day.redChief.includes(this)) return true;
        if (day.redStaff.includes(this)) return true;
        if (day.consult.includes(this)) return true;
        else return false;
    }
    isWorkingNight(day) {

        //check if working night Sr/Jr today
        if (day.nightSr.includes(this)) return true;
        if (day.nightJr.includes(this)) return true;
        else return false;
    }
    isOnVacation(day) {
        if (this.availability[day.weekNum()] == 0) return true;
        else return false;
    }
    isWorkingThisWeekend(day) {

        var week = day.weekNum();
        var fri = month[(week * 7) + 4];
        var sat = month[(week * 7) + 5];
        var sun = month[(week * 7) + 6];

        //check friday (night only)
        if (this.isWorkingNight(fri)) return true;

        //check saturday
        if (this.isWorking(sat)) return true;

        //check sunday
        if (this.isWorking(sun)) return true;
    }
    hasGoldenWeekend() {

        //special name to avoid conflicting with "var day" in populateSchedule()
        var dayGW = 0;

        for (let week = 0; week < 4; week++) {
            dayGW = month[week * 7];
            if (!this.isWorkingThisWeekend(dayGW)) return true;
        }

        return false;
    }

    color() {
        if (this.team == 'blue') return 'blue';
        if (this.team == 'red') return 'red';
        else return 'black';
    }
}
class Day {

    constructor(argNum) {

        this.num = argNum;

        for (let position of positions) {
            this[position] = [];
        }
    }

    weekNum() {
        return Math.trunc(this.num / 7);
    }
    dayNum() {
        return this.num % 7;
    }
    yesterday() {
        if (this.num == 0) return null;
        else return month[this.num - 1];
    }
    tomorrow() {
        if (this.num == 27) return null;
        else return month[this.num + 1];
    }
    isFriSat() {
        if (this.dayNum() == 4 || this.dayNum() == 5) return true;
        else return false;
    }
    isSatSun() {
        if (this.dayNum() == 5 || this.dayNum() == 6) return true;
        else return false;
    }
    has(team, position) {

        //blue or red
        if (team == 'blue' || team == 'red') {

            for (let resident of this[team + 'Staff']) {
                if (!empty(resident)) {
                    if (position == 'sr') {
                        if (resident.canSr()) return true;
                    }
                    else if (position == 'jr') {
                        if (resident.canJr()) return true;
                    }
                }
            }
        }

        return false;
    }
    name() {
        var dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return dayNames[this.dayNum()];
    }
}

//-----------------------------

function load() {

    //verify no duplicate names
    if (hasDuplicateNames()) {
        document.body.innerHTML = '';
        return;
    }

    //clear residents Object and HTML
    residents = [];
    document.getElementById('all-residents').innerHTML = '';
    clearSchedule();

    //create residents Object list
    for (let resident of residentsAll) {
        residents.push(new Resident(resident.name, resident.PGY));
    }

    //output residents from Object list
    loadResidents();

    //load halfway radio input
    loadHalfwayRadio();

    //for efficient testing
    //assignTeams();
    //generateSchedule();
}
function hasDuplicateNames() {

    var names = [];
    for (let resident of residentsAll) {
        if (names.includes(resident.name)) {
            window.alert('Error: duplicate name (' + resident.name + ')');
            return true;
        }
        else {
            names.push(resident.name);
        }
    }

    return false;
}
function loadResidents() {

    //clear residents HTML and schedule HTML
    document.getElementById('all-residents').innerHTML = '';
    document.getElementById('schedule').innerHTML = '';

    //display residents in html for selection
    for (let resident of residents) {
        listResident(resident);
    }

    //update resident total & team count - based on resident Objects & team Objects
    updateTotalCount();
    updateTeamCount();
}
function listResident(resident) {

    var name = resident.name;
    var PGY = resident.PGY;

    var form = document.getElementById('all-residents');
    var label = document.createElement('label');
    var span = document.createElement('span');

    //name & PGY
    span.textContent = PGY + ' - ' + name;
    span.setAttribute('class', 'resident-availability-name'); //set standard width
    label.appendChild(span);

    //availbility checkboxes (4)
    var checkboxes = [];
    for (let i = 0; i < 4; i++) {
        checkboxes[i] = document.createElement('input');
        checkboxes[i].type = 'checkbox';

        //check box if available that week
        if (resident.availability[i] == 1) checkboxes[i].checked = true;
        else checkboxes[i].checked = false;

        //the handle to get all checkboxes later
        checkboxes[i].name = 'resident-availability-checkbox';

        //specific attributes including id
        checkboxes[i].setAttribute('id', 'checkbox-' + name + '-' + i);
        checkboxes[i].setAttribute('fName', name);
        checkboxes[i].setAttribute('PGY', PGY);
        checkboxes[i].setAttribute('week', i);

        //update resident availability and dropdown options if appropriate - links to clear team, schedule, stats
        checkboxes[i].addEventListener('change', updateAvailability);

        label.append(checkboxes[i]);
    }

    //team dropdown
    label.append(createDropdown(resident));

    form.appendChild(label);
    form.appendChild(document.createElement('br'));
}
function createDropdown(resident) {

    var dropdown;
    var values = ['---', 'blue', 'red', 'edu'];
    var options = [];


    if (resident._availability() == 0) values = ['---'];

    //create dropdown elements
    dropdown = document.createElement('select');
    dropdown.setAttribute('id', 'dropdown-' + resident.name); //handle to change visible dropdown option once teams are assigned
    for (let i = 0; i < values.length; i++) {
        options[i] = document.createElement('option');
        options[i].innerHTML = values[i];

        if (values[i] == 'blue' || values[i] == 'red') {
            options[i].setAttribute('class', values[i] + '-text');
        }
        else options[i].setAttribute('class', 'black-text');
        dropdown.append(options[i]);
    }

    //link on change functions
    dropdown.onchange = function () {

        //update Resident object
        unassignTeam(resident);
        if (dropdown.value == 'blue') pushBlue(resident);
        else if (dropdown.value == 'red') pushRed(resident);
        else if (dropdown.value == 'edu') pushEdu(resident);

        //update color
        if (dropdown.value == 'blue') dropdown.setAttribute('class', 'blue-text');
        else if (dropdown.value == 'red') dropdown.setAttribute('class', 'red-text');
        else dropdown.setAttribute('class', 'black-text');

        //update team counts - based on resident Objects
        updateTeamCount();

        //clear schedule (along with resident shifts and stats)
        clearSchedule();
    };

    return dropdown;
}
function loadHalfwayRadio() {

    var halfwayHTML = document.getElementById('halfway');
    var form = document.createElement('form');
    var options = ['no', 'yes'];
    var label;
    var input;
    var str;

    halfwayHTML.innerText = 'Halfway?';

    for (let option of options) {

        input = document.createElement('input');
        input.type = 'radio';
        input.id = option;
        input.name = 'halfwayRadio';
        input.value = option;
        input.onchange = function () {

            if (option == 'no') halfway = false;
            if (option == 'yes') halfway = true;

            clearSchedule();
        };

        if (halfway == false && option == 'no') input.checked = 'checked';
        if (halfway == true && option == 'yes') input.checked = 'checked';

        label = document.createElement('label');
        label.htmlFor = option;
        str = option[0].toUpperCase() + option.slice(1);
        label.innerText += '  ' + str;

        form.append(input);
        form.append(label);
        form.append(document.createElement('br'));
    }

    halfwayHTML.append(form);
}


function updateAvailability() {

    var checkbox;
    var availability;
    var existingDropdown;
    var newDropdown;

    //update each resident
    for (let resident of residents) {

        //update resident Object
        resident.availability = [0, 0, 0, 0];
        for (let i = 0; i < 4; i++) {
            checkbox = document.getElementById('checkbox-' + resident.name + '-' + i);
            if (checkbox.checked) resident.availability[i] = 1;
        }

        //update dropdown options
        var existingDropdown = document.getElementById('dropdown-' + resident.name);
        availability = resident._availability();
        newDropdown = createDropdown(resident);
        existingDropdown.parentNode.replaceChild(newDropdown, existingDropdown);
    }

    //update resident total count - based on resident Objects
    updateTotalCount();

    //link to reset team assignments
    resetTeamAssignments();
}
function updateTotalCount() {

    var totalCountHTML;
    var total = 0;

    for (let resident of residents) {
        total += (resident._availability() / 4.0);
    }

    totalCountHTML = document.getElementById('total-count');
    totalCountHTML.innerHTML = 'Residents Available: ' + total;
}
function resetTeamAssignments() {

    //reset all dropboxes
    for (let resident of residents) {
        changeDropdown(resident, 'reset');
    }
}
function updateTeamCount() {

    //update team count based on availabilities of team lists
    var teamCountHTML = document.getElementById('team-count');
    var blueCount = 0;
    var redCount = 0;
    var eduCount = 0;

    for (let resident of blueTeam) {
        blueCount += resident._availability();
    }
    for (let resident of redTeam) {
        redCount += resident._availability();
    }
    for (let resident of eduTeam) {
        eduCount += resident._availability();
    }

    teamCountHTML.innerHTML = '';
    teamCountHTML.innerHTML += '&nbsp&nbsp' + 'Blue Team: ' + (blueCount / 4) + '<br>';
    teamCountHTML.innerHTML += '&nbsp&nbsp' + 'Red Team: ' + (redCount / 4) + '<br>';
    teamCountHTML.innerHTML += '&nbsp&nbsp' + 'Edu Team: ' + (eduCount / 4);
}
function clearSchedule() {

    //clear month Object
    month = [];

    //clear display
    document.getElementById('schedule').innerHTML = '';

    //reset resident shifts - but keep team assignments and availability
    for (let resident of residents) {
        for (let shiftType of shiftTypes) {
            resident[shiftType] = [0, 0, 0, 0];
        }
    }

    //link to clear stats
    clearStats();
}
function clearStats() {

    stats = [];
    document.getElementById('stats-title').innerHTML = '';
    document.getElementById('stats').innerHTML = '';
}

function changeDropdown(resident, argTeam = 'reset') {

    //change dropdown
    var dropdown = document.getElementById('dropdown-' + resident.name);
    for (let option of dropdown.options) {
        if (argTeam != 'reset' && option.value == argTeam) option.selected = true;
        else option.selected = false;
    }

    //trigger 'onchange' function to change the dropdown color, update resident Object, clear schedule/stats
    dropdown.dispatchEvent(new Event("change"));
}
function unassignTeam(resident) {

    //unassign from all teams
    var teams = [blueTeam, redTeam, eduTeam];
    for (let team of teams) {
        if (team.includes(resident)) {
            team.splice(team.indexOf(resident), 1);
        }
    }

    resident.team = '---';
}
function pushBlue(resident) {

    //add to blue team and change teamColor
    blueTeam.push(resident);
    resident.team = 'blue';
}
function pushRed(resident) {

    //add to red team and change teamColor
    redTeam.push(resident);
    resident.team = 'red';
}
function pushEdu(resident) {

    //add to edu team and change teamColor
    eduTeam.push(resident);
    resident.team = 'edu';
}

function assignTeams() {

    var chiefs = [];
    var bluePoints = 0;
    var redPoints = 0;

    //clear team assignments (links to dropdowns-schedule-shifts-stats)
    resetTeamAssignments();    

    //set up chiefs arrays
    sortByPGYHigh(residents);
    for (let resident of residents) {
        if (resident.PGY == 5) chiefs.push(resident);
        else break;
    }

    //choose edu chief based on least availability
    sortByAvailabilityHigh(chiefs);
    if (chiefs.length == 3) {
        if (chiefs[2]._availability() > 0) changeDropdown(chiefs[2], 'edu');
    }

    //sort based on team size (rand if tied)
    sortByPGYHigh(residents);
    for (let resident of residents) {

        //edu edge case
        if (resident.team == 'edu') continue;

        if (bluePoints < redPoints) {
            changeDropdown(resident, 'blue');
            bluePoints += resident._availability();
        }
        else if (redPoints < bluePoints) {
            changeDropdown(resident, 'red');
            redPoints += resident._availability();
        }
        else {
            if (rand() < 0) {
                changeDropdown(resident, 'blue');
                bluePoints += resident._availability();
            }
            else {
                changeDropdown(resident, 'red');
                redPoints += resident._availability();
            }
        }
    }



    //fancy algorithm, questionably worse than the basic sort...
    /*
    var fullTime = [];
    var partTime = [];
    var noTime = [];
    var chiefs = [];
    var availability = 0;
    var sorter = 0;
    var bluePoints = 0;
    var redPoints = 0;


    

    //set up extra resident arrays
    sortByPGYHigh(residents);
    for (let resident of residents) {
        //separate based on availability
        availability = resident._availability();
        if (availability == 4) fullTime.push(resident);
        else if (availability > 0) partTime.push(resident);
        else noTime.push(resident);
        //get chiefs
        if (resident.PGY == 5) chiefs.push(resident);
    }

    //choose edu chief based on least availability
    sortByAvailabilityHigh(chiefs);
    if (chiefs.length == 3) {
        if (chiefs[2]._availability()>0) changeDropdown(chiefs[2], 'edu');
    }

    //assign all full time residents
    for (let resident of fullTime) {

        //set sorter (negative -> blue, positive -> red)
        sorter = (blueTeam.length - redTeam.length);
        if (sorter == 0) sorter = rand();

        //assign one chief to each team, exclude eduChief
        if (resident.PGY == 5) {
            //skip assignment if already on edu team
            if (resident.team == 'edu') continue;
            //this assumes at least 2 chiefs have full availability
            else {
                if (sorter < 0) changeDropdown(resident, 'blue');
                else changeDropdown(resident, 'red');
            }
            continue;
        }

        //even out team size if needed
        if (blueTeam.length < redTeam.length) changeDropdown(resident, 'blue');
        else if (blueTeam.length > redTeam.length) changeDropdown(resident, 'red');

        //otherwise each team should have one resident from each PGY
        else {
            if (resident.PGY != blueTeam[blueTeam.length - 1].PGY) changeDropdown(resident, 'blue');
            else if (resident.PGY != redTeam[redTeam.length - 1].PGY) changeDropdown(resident, 'red');

            //otherwise go random
            else {
                if (sorter < 0) changeDropdown(resident, 'blue');
                else changeDropdown(resident, 'red');
            }
        }
    }

    //assign part time residents to a team - simply try to equalize available weeks
    sortByAvailabilityHigh(partTime)
    for (let resident of partTime) {

        //skip if edu chief
        if (resident.team == 'edu') continue;

        //set sorter (negative -> blue, positive -> red)
        sorter = (bluePoints - redPoints);
        if (sorter == 0) sorter = rand();

        //assign accordingly
        if (sorter < 0) {
            changeDropdown(resident, 'blue');
            bluePoints += resident._availability();
        }
        else {
            changeDropdown(resident, 'red');
            redPoints += resident._availability();
        }
    }


    */
}

function rand() {

    var randNum = 0;

    //random number [0, 1)
    randNum = Math.random();

    //random number [-1, 1)
    randNum = randNum * 2 - 1;

    //don't allow return 0
    if (randNum == 0) return rand();

    return randNum;
}

//------------------------------------------
function blankSchedule() {
    
    //Error Check
    //1. nobody on team '---' if they have any availability
    for (let resident of residents) {
        if (resident._availability() > 0 && resident.team == '---') {
            alert(resident.name + ' has some availability. Please assign them to a team.')
            return;
        }
    }
    //2. only one resident on team 'edu'
    if (eduTeam.length > 1) {
        alert('Only 1 resident allowed on edu team (currently there are ' + eduTeam.length + ').');
        return;
    }
    //3. edu team member must be PGY 4 or 5
    if (eduTeam.length == 1 && eduTeam[0].PGY < 4) {
        alert('Only PGY 4 or 5 allowed on edu team (currently PGY-' + eduTeam[0].PGY + ').');
        return;
    }

    //clear schedule, month Object, resident shifts, stats
    clearSchedule();

    //scaffold month Object
    for (let i = 0; i < 28; i++) {
        month.push(new Day(i));
    }

    //do NOT fill month Object

    //display schedule
    printFullSchedule();

    //update and print stats
    updateStats();
}
function generateSchedule() {

    //Error Check
    //1. nobody on team '---' if they have any availability
    for (let resident of residents) {
        if (resident._availability() > 0 && resident.team == '---') {
            alert(resident.name + ' has some availability. Please assign them to a team.')
            return;
        }
    }
    //2. only one resident on team 'edu'
    if (eduTeam.length > 1) {
        alert('Only 1 resident allowed on edu team (currently there are ' + eduTeam.length + ').');
        return;
    }
    //3. edu team member must be PGY 4 or 5
    if (eduTeam.length == 1 && eduTeam[0].PGY < 4) {
        alert('Only PGY 4 or 5 allowed on edu team (currently PGY-' + eduTeam[0].PGY + ').');
        return;
    }

    //clear schedule, month Object, resident shifts, stats
    clearSchedule();

    //scaffold month Object
    for (let i = 0; i < 28; i++) {
        month.push(new Day(i));
    }

    //fill month Object
    populateMonth();

    //display schedule
    printFullSchedule();

    //update and print stats
    updateStats();
}
function populateMonth() {

    var chosen;
    var day;
    var sr24;
    var jr24;

    for (let week = 0; week < 4; week++) {

        //1. assign weekday chiefs
        for (let i = week * 7; i < (week * 7) + 5; i++) {
            day = month[i];
            chosen = chooseChief(blueTeam, day);
            if (!empty(chosen)) day.blueChief.push(assignShift(chosen, day));
            chosen = chooseChief(redTeam, day);
            if (!empty(chosen)) day.redChief.push(assignShift(chosen, day));
        }

        //2. assign weekend chiefs (edu chief and one 4th year)
        for (let i = (week * 7) + 5; i < (week * 7) + 7; i++) {
            day = month[i];
            chosen = chooseChiefWeekend(blueTeam, day);
            if (!empty(chosen)) day.blueChief.push(assignWeekend(chosen, day));
            chosen = chooseChiefWeekend(redTeam, day);
            if (!empty(chosen)) day.redChief.push(assignWeekend(chosen, day));
        }

        //3. assign 24 Jr
        for (let i = (week * 7) + 4; i < (week * 7) + 6; i++) {
            
            day = month[i];

            //choose the 24hr jr (will return null if none available)
            jr24 = choose24Jr(residents, day);
            if (empty(jr24)) continue;
        
            //assign to night shift
            day.nightJr.push(assignNight(jr24, day));

            //skip if already working during the day
            if (jr24.isWorkingDay(day)) continue;

            //if Fri, assign to team staff
            if (day.dayNum() == 4) {
                day[jr24.team + 'Staff'].push(assignShift(jr24, day));
            }

            //if Sat, assign to team staff
            if (day.dayNum() == 5) {
                day[jr24.team + 'Staff'].push(assignWeekend(jr24, day));
            }
        }

        //4. assign 24 Sr (Sat first, then Fri to best consider PGY 5s)
        for (let i = (week * 7) + 5; i > (week * 7) + 3; i--) {
        
            day = month[i];

            //choose the 24hr sr (will return null if none available)
            sr24 = choose24Sr(residents, day);
            if (empty(sr24)) continue;

            //assign to night shift
            day.nightSr.push(assignNight(sr24, day));

            //skip if already working during the day
            if (sr24.isWorkingDay(day)) continue;

            //if Fri, assign to team staff
            if (day.dayNum() == 4) {
                day[sr24.team + 'Staff'].push(assignShift(sr24, day));
            }

            //if Sat, assign to team staff (vs consult if jr24 already on team)
            if (day.dayNum() == 5) {
                if (day[sr24.team + 'Staff'].length = 0) {
                    day[sr24.team + 'Staff'].push(assignWeekend(sr24, day));
                }
                else day.consult.push(assignConsult(sr24, day));
            }
        }

        //5. assign weekend staff (blue, red, consults)
        for (let i = (week * 7) + 5; i < (week * 7) + 7; i++) {
            day = month[i];
            //blue Staff
            if (day.blueStaff.length == 0) {
                chosen = chooseWeekend(blueTeam, day);
                if (!empty(chosen)) day.blueStaff.push(assignWeekend(chosen, day));
            }
            //red Staff
            if (day.redStaff.length == 0) {
                chosen = chooseWeekend(redTeam, day);
                if (!empty(chosen)) day.redStaff.push(assignWeekend(chosen, day));
            }
            //consults
            if (day.consult.length == 0) {
                chosen = chooseConsult(residents, day);
                if (!empty(chosen)) day.consult.push(assignConsult(chosen, day));
            }
        }

        //6. assign weekday consults
        for (let i = week * 7; i < (week * 7) + 5; i++) {
            day = month[i];
            chosen = chooseConsult(residents, day);
            if (!empty(chosen)) day.consult.push(assignConsult(chosen, day));
        }

        //7. assign weekday sr
        for (let i = week * 7; i < (week * 7) + 5; i++) {

            day = month[i];

            //seniors
            if (!day.has('blue', 'sr')) {
                chosen = chooseSr(blueTeam, day);
                if (!empty(chosen)) day.blueStaff.push(assignShift(chosen, day));
            }
            if (!day.has('red', 'sr')) {
                chosen = chooseSr(redTeam, day);
                if (!empty(chosen)) day.redStaff.push(assignShift(chosen, day));
            }
        }


        //8. assign week day jr
        for (let i = week * 7; i < (week * 7) + 5; i++) {

            day = month[i];

            //assign junior (unless already 2 staff)
            if (day.blueStaff.length < 2) {
                chosen = chooseJr(blueTeam, day);
                if (!empty(chosen)) day.blueStaff.push(assignShift(chosen, day));
            }
            if (day.redStaff.length < 2) {
                chosen = chooseJr(redTeam, day);
                if (!empty(chosen)) day.redStaff.push(assignShift(chosen, day));
            }

            //organize staff list
            sortByPGYHigh(day.blueStaff);
            sortByPGYHigh(day.redStaff);
        }
    }
}

function assignShift(resident, day) {

    if (empty(resident)) return null;

    var week = day.weekNum();
    resident.shifts[week] += 1;

    return resident;
}
function assignWeekend(resident, day) {

    if (empty(resident)) return null;

    //record weekend
    var week = day.weekNum();
    resident.weekends[week] += 1;

    return assignShift(resident, day);
}
function assignNight(resident, day) {

    if (empty(resident)) return null;

    var week = day.weekNum();
    resident.nights[week] += 1;

    return assignWeekend(resident, day);
}
function assignConsult(resident, day) {

    if (empty(resident)) return null;

    //record consult shift
    var week = day.weekNum();
    resident.consults[week] += 1;

    //if weekend, record weekend shift
    if (day.isSatSun()) resident.weekends[week] += 1;

    //recursively record shift
    return assignShift(resident, day);
}
function unassign(resident, day, argPosition) {

    var week = day.weekNum();

    resident.shifts[week] -= 1;

    if (argPosition.includes('night')) resident.nights[week] -= 1;
    if (argPosition.includes('consult')) resident.consults[week] -= 1;
    if (day.isSatSun()) resident.weekends[week] -= 1;
}

function sortByPGYHigh(residents) {

    residents.sort(byPGYHigh);
}
function sortByAvailabilityHigh(residents) {

    residents.sort(byAvailabilityHigh);
}
function sortByWeekends(residents) {

    residents.sort(byWeekends);
}
function sortByNights(residents) {

    residents.sort(byNights);
}
function sortByConsults(residents) {

    residents.sort(byConsults);
}
function sortByShifts(residents) {

    residents.sort(byShifts);
}
function sortByShiftsThisWeek(residents, day) {

    residents.sort(function (low, high) {

        var num = 0;
        var week = day.weekNum();

        //sort low-high shifts this week
        num = low.shifts[week] - high.shifts[week];
        if (num != 0) return num;

        //if equal, sort low-high PGY
        num = low.PGY - high.PGY;
        if (num != 0) return num;

        //if equal, return random
        num = rand();
        return num;
    });
}
function sortByGoldenWeekend(residents, day) {

    residents.sort(function (low, high) {

        
    });
}

function byPGYHigh(low, high) {

    var num = 0;

    //sort PGY high to low
    num = high.PGY - low.PGY;
    if (num != 0) return num;

    //if equal return random
    num = rand();
    return num;
}
function byPGYLow(low, high) {

    var num = 0;

    //sort PGY low to high
    num = low.PGY - high.PGY;
    if (num != 0) return num;

    //if equal return random
    num = rand();
    return num;
}
function byAvailabilityHigh(low, high) {

    var num = 0;

    //sort high to low
    num = high._availability() - low._availability();
    if (num != 0) return num;

    //if equal return PGY high to low
    num = byPGYHigh(low, high);
    return num;
}
function byShifts(low, high) {

    var num = 0;

    //sort low-high weighted average shifts
    num = (low._shifts() / low._availability()) - (high._shifts() / high._availability());
    if (num != 0) return num;

    //if equal, sort low-high PGY
    num = byPGYLow(low, high);
    return num;
}
function byWeekends(low, high) {

    var num = 0;

    //sort golden weekend high-low (true=1, false=0)
    //num = byGoldenWeekend(low, high);
    //if (num != 0) return num;

    //if equal, sort weekends low-hgh
    num = (low._weekends() / low._availability()) - (high._weekends() / high._availability());
    if (num != 0) return num;

    //if equal, sort shifts low-high
    num = byShifts(low, high);
    return num;
}
function byNights(low, high) {

    var num = 0;

    //sort golden weekend high-low (true=1, false=0)
    //num = byGoldenWeekend(low, high);
    //if (num != 0) return num;

    //if equal, sort nights low-high
    num = (low._nights() / low._availability()) - (high._nights() / high._availability());
    if (num != 0) return num;

    //if equal, if NOT PGY-5, sort weekend low-high
    if (low.PGY != 5 && high.PGY != 5) num = byWeekends(low, high);
    if (num != 0) return num;

    //otherwise sort shifts low-high
    num = byShifts(low, high);

    return num;
}
function byConsults(low, high) {

    var num = 0;

    //sort consults low-high
    num = (low._consults() / low._availability()) - (high._consults() / high._availability());
    if (num != 0) return num;

    //if equal, sort by weighted average shifts
    num = byShifts(low, high);
    return num;
}
function byGoldenWeekend(low, high) {

    var num = 0;

    //sort golden weekend high-low (true=1, false=0)
    num = high.hasGoldenWeekend() - low.hasGoldenWeekend();
    if (num != 0) return num;

    //allow return of 0 at this time
    return num;
}

function empty(resident) {

    if (resident == null) return true;

    else return false;
}

function chooseChief(argTeam, day) {

    sortByPGYHigh(argTeam);
    for (let resident of argTeam) {
        if (resident.canChief() && resident.isAvailableDay(day)) return resident;
    }

    return null;
}
function chooseChiefWeekend(argTeam, day) {

    //if Sunday, keep weekend senior same as Sat
    if (day.dayNum() == 6) {
        if (argTeam == blueTeam) return day.yesterday().blueChief[0];
        else if (argTeam == redTeam) return day.yesterday().redChief[0];
        else return null;
    }
    //should education chief be weekend senior? (based on team + even/odd week)
    sortByWeekends(eduTeam);
    for (let resident of eduTeam) {
        if (resident.canChiefWeekend() && resident.isAvailableDay(day)) {
            if (argTeam == blueTeam && day.weekNum() % 2 == 0) return resident;
            if (argTeam == redTeam && day.weekNum() % 2 == 1) return resident;
        }
    }

    //otherwise determine 4th year weekend senior
    sortByWeekends(argTeam);
    for (let resident of argTeam) {
        if (resident.canChiefWeekend() && resident.isAvailableDay(day)) return resident;
    }

    return null;
}
function chooseWeekend(argTeam, day) {

    sortByWeekends(argTeam);

    for (let resident of argTeam) {
        if (resident.canJr() && resident.isAvailableDay(day)) return resident;
    }

    return null;
}
function chooseConsult(argTeam, day) {

    //sort by weekends on weekends, otherwise sort by consults
    if (day.isSatSun()) sortByWeekends(argTeam);
    else sortByConsults(argTeam);

    for (let resident of argTeam) {
        if (resident.canConsult() && resident.isAvailableDay(day)) return resident;
    }

    return null;

}
function chooseSr(argTeam, day) {

    sortByShifts(argTeam);

    for (let resident of argTeam) {
        if (resident.canSr() && resident.isAvailableDay(day)) return resident;
    }

    return null;
}
function chooseJr(argTeam, day) {

    sortByShifts(argTeam);

    for (let resident of argTeam) {
        if (resident.canJr() && resident.isAvailableDay(day)) return resident;
    }

    return null;
}

function choose24Sr(argTeam, day) {

    //find 24 senior (if Sat, cannot be weekday chief)
    sortByNights(argTeam);
    for (let resident of argTeam) {
        if (resident.canNightSr() && resident.isAvailableNight(day)) {
            if (day.dayNum() != 5 || resident.PGY != 5) {
                return resident;
            }
        }
    }

    return null;
}
function choose24Jr(argTeam, day) {

    //find 24 jr (same team allowed)
    sortByNights(argTeam);
    for (let resident of argTeam) {
        if (resident.canNightJr() && resident.isAvailableNight(day)) {
            return resident;
        }
    }

    return null;
}

function printFullSchedule() {

    var schedule = document.getElementById('schedule');
    var week;

    //clear display
    schedule.innerHTML = "";

    //make each week
    for (let weekNum = 0; weekNum < 4; weekNum++) {
        week = makeWeek(weekNum);
        schedule.append(week);
    }
}
function makeWeek(argWeekNum) {

    var weekHTML;
    var dateRow;
    var assignmentRow;
    var floatPoolRow;

    //create week container
    weekHTML = document.createElement('div');

    //create date/day headers row
    dateRow = makeDateRow();
    weekHTML.append(dateRow);

    //create assignments row
    assignmentRow = makeAssignmentsRow(argWeekNum);
    weekHTML.append(assignmentRow);

    //create float pool row
    floatPoolRow = makeFloatPoolRow(argWeekNum);
    weekHTML.append(floatPoolRow);

    return weekHTML;
}
function makeDateRow() {

    var row;
    var cell;

    row = document.createElement('tr');

    for (let day = 0; day < 7; day++) {
        cell = makeDateCell(day);
        row.append(cell);
    }

    return row;
}
function makeDateCell(day) {

    var cell;
    var dayName;
    var daysOfTheWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    dayName = daysOfTheWeek[day];

    cell = document.createElement('th');
    cell.innerHTML += dayName;

    return cell;
}
function makeAssignmentsRow(argWeek) {

    var row;
    var cell;

    row = document.createElement('tr');
    for (let day = argWeek * 7; day < (argWeek * 7) + 7; day++) {
        cell = makeAssignmentCell(argWeek, day);
        row.append(cell);
    }

    return row;
}
function makeAssignmentCell(argWeek, day) {

    var cell;
    var wrapper;
    var positionsColumn;
    var wrapperTeams;   //teams (blue and red)
    var wrapperSpecial; //consults & nights
    var namesColumn;
    var textColor;
    var renamePosition;
    var positionHTML;
    var nameHTML;
    var tooltipHTML;

    //cell scaffold
    cell = document.createElement('td');
    cell.setAttribute('id', 'day' + day);

    //wrapper scaffold - need single element to align colums to top of cell
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'wrapper');

    //scaffold positions column
    positionsColumn = document.createElement('div');
    //positionsColumn.setAttribute('id', 'day' + day + '-positions');
    positionsColumn.setAttribute('class', 'position-column');
    wrapperTeams = document.createElement('div');
    wrapperTeams.setAttribute('class', 'wrapper-teams');
    //wrapperTeams.setAttribute('id', 'day' + day + '-wrapper-teams')
    wrapperSpecial = document.createElement('div');
    wrapperSpecial.setAttribute('class', 'wrapper-special');
    //wrapperSpecial.setAttribute('id', 'day' + day + '-wrapper-special');
    positionsColumn.append(wrapperTeams, wrapperSpecial);

    //scaffold names column
    namesColumn = document.createElement('div');
    namesColumn.setAttribute('id', 'day' + day + '-names');
    namesColumn.setAttribute('class', 'name-column');

    wrapperTeams.innerHTML = '';
    wrapperSpecial.innerHTML = '';
    namesColumn.innerHTML = '';

    //output each position
    for (let position of positions) {
        for (let i = 0; i < month[day][position].length; i++) {

            let resident = month[day][position][i];

            if (!empty(resident)) {

                if (position.includes('blue')) textColor = 'blue-text';
                else if (position.includes('red')) textColor = 'red-text';
                else if (position.includes('consult')) textColor = 'purple-text';
                else textColor = 'black-text';

                if (position.includes('Chief')) renamePosition = 'Chief';
                else if (position.includes('Staff')) renamePosition = '&nbsp;';
                else renamePosition = position;

                positionHTML = document.createElement('div');
                positionHTML.setAttribute('class', textColor);
                positionHTML.innerHTML = renamePosition;

                nameHTML = document.createElement('div');
                nameHTML.setAttribute('class', textColor + ' resident ' + resident.name);
                nameHTML.addEventListener('mouseover', () => mouseOver(resident.name));
                nameHTML.addEventListener('mouseout', () => mouseOut(resident.name));
                nameHTML.innerHTML = resident.name;
                nameHTML.innerHTML += ' (' + resident.shifts[argWeek] + ')';
                nameHTML.addEventListener('click', () => removeResident(resident, month[day], position));

                tooltipHTML = makeToolTip(resident, argWeek);
                nameHTML.append(tooltipHTML);

                if (position.includes('blue') || position.includes('red')) {
                    wrapperTeams.append(positionHTML);
                }
                else {
                    wrapperSpecial.append(positionHTML);
                }

                namesColumn.append(nameHTML);
            }
        }
    }

    //add children scaffolds to cell
    wrapper.append(positionsColumn, namesColumn);
    cell.append(wrapper);

    return cell;
}
function makeToolTip(resident, argWeek) {

    var tooltip;

    tooltip = document.createElement('span');
    tooltip.setAttribute('class', 'tooltip');
    tooltip.innerHTML += 'shifts this week: ' + resident.shifts[argWeek] + '<br>';
    tooltip.innerHTML += 'total shifts: ' + resident._shifts() + '<br>';
    tooltip.innerHTML += 'total consults: ' + resident._consults() + '<br>';
    tooltip.innerHTML += 'total weekends: ' + resident._weekends() + '<br>';
    tooltip.innerHTML += 'total nights: ' + resident._nights() + '<br>';

    return tooltip;
}
function makeFloatPoolRow(argWeek) {

    var row;
    var cell;
    var floatPool = {};
    var teams = ['blue', 'red', 'edu', '---'];
    var residentHTML;
    var tooltipHTML;
    var container;
    var menu;
    var option;
    var customMenu;
    var menuTitle;


    row = document.createElement('tr');
    for (let i = (argWeek * 7); i < (argWeek * 7) + 7; i++) {

        let day = month[i];

        cell = document.createElement('td');
        cell.setAttribute('id', 'day' + day.num + '-floatPool');
        cell.innerHTML += 'Available to Work<br>';

        //clear float pool lists
        for (let team of teams) {
            floatPool[team] = [];
        }

        //find all available residents and separate based on team
        for (let resident of residents) {
            //if resident available for day
            if (resident.isAvailableDay(day)) {
                floatPool[resident.team].push(resident);
            }
            //or if resident available for any empty night shift
            else if (day.isFriSat() && resident.isAvailableNight(day)) {
                if (day.nightSr.length == 0 && resident.canNightSr()) {
                    floatPool[resident.team].push(resident);
                }
                else if (day.nightJr.length == 0 && resident.canNightJr()) {
                    floatPool[resident.team].push(resident);
                }
            }
        }

        //sort float pools by shifts this week
        for (let team of teams) {
            sortByShiftsThisWeek(floatPool[team], day);
        }

        //output by team - add color, click, mouseover, and rightClick functions
        for (let team of teams) {
            for (let resident of floatPool[team]) {

                //text
                residentHTML = document.createElement('div');
                residentHTML.innerHTML = resident.name;
                residentHTML.innerHTML += ' (' + resident.shifts[argWeek] + ')';

                //color
                residentHTML.setAttribute('class', resident.color() + '-text resident ' + resident.name);

                //custom right click menu
                container = document.getElementById('custom-menus');
                menu = document.createElement('div');
                menu.setAttribute('id', 'custom-menu-' + resident.name + day.num);
                menu.setAttribute('class', 'custom-menu');

                menuTitle = document.createElement('div');
                menuTitle.innerHTML = 'Assign to: ';
                menu.append(menuTitle);

                for (let position of positions) {

                    option = document.createElement('div');
                    option.setAttribute('class', 'custom-menu-item');
                    option.innerHTML = '- ' + position;

                    option.addEventListener('click', function () {
                        addResident(resident, day, position);
                    });

                    menu.append(option);
                }
                
                container.append(menu);

                //events
                residentHTML.addEventListener('click', () => addResident(resident, day));
                residentHTML.addEventListener('mouseover', () => mouseOver(resident.name));
                residentHTML.addEventListener('mouseout', () => mouseOut(resident.name));

                residentHTML.addEventListener('contextmenu', function (event) {

                    // Prevent the default context menu from appearing
                    event.preventDefault();

                    // Your custom right-click logic goes here
                    customMenu = document.getElementById('custom-menu-' + resident.name + day.num);
                    customMenu.style.left = event.clientX + 'px';
                    customMenu.style.top = event.clientY + 'px';
                    customMenu.style.display = 'block';
                });

                // Hide the custom menu on any click outside the menu
                document.addEventListener('click', function () {
                    document.getElementById('custom-menu-' + resident.name + day.num).style.display = 'none';
                });

                //add tooltip and append
                tooltipHTML = makeToolTip(resident, argWeek);
                residentHTML.append(tooltipHTML);
                cell.append(residentHTML);
            }
        }
        row.append(cell);
    }

    return row;
}

function mouseOver(argName) {

    var elementsToBold = document.querySelectorAll('.' + argName);

    for (let element of elementsToBold) {
        element.style.fontWeight = "bold";
    }
}
function mouseOut(argName) {

    var elementsToUnBold = document.querySelectorAll('.' + argName);

    for (let element of elementsToUnBold) {
        element.style.fontWeight = "normal";
    }
}
function addResident(resident, day, residentPosition = '') {

    var residentPosition;

    //


    //choose what position to place resident
    if (residentPosition == '') residentPosition = choosePosition(resident, day);

    //add to that position
    //assign night
    if (residentPosition.includes('night')) day[residentPosition].push(assignNight(resident, day));
    //assign consult - will catch consult/weekends
    else if (residentPosition.includes('consult')) day[residentPosition].push(assignConsult(resident, day));
    //assign weekend
    else if (day.isSatSun()) day[residentPosition].push(assignWeekend(resident, day));
    //assign shift
    else day[residentPosition].push(assignShift(resident, day));

    //re-sort by PGY High
    sortByPGYHigh(day[residentPosition]);

    //re-output schedule/stats
    printFullSchedule();

    //update and print stats
    updateStats();
}
function choosePosition(resident, day) {

    //catch edge case if resident can only work night
    if (resident.isAvailableNight(day) && !resident.isAvailableDay(day)) {
        if (day.nightSr.length == 0 || resident.canNightSr()) return 'nightSr';
        else if (day.nightJr.length == 0 || resident.canNightJr()) return 'nightJr';
        else return '';
    }

    //if resident can be chief or weekend chief, check for chief vacancy
    if ((!day.isSatSun() && resident.canChief()) || (day.isSatSun() && resident.canChiefWeekend())) {
        if (resident.team == 'blue' || resident.team == 'edu') {
            if (day.blueChief.length == 0) return 'blueChief';
        }
        else if (resident.team == 'red' || resident.team == 'edu') {
            if (day.redChief.length == 0) return 'redChief';
        }
    }

    //if resident can nightSr, check for nightSr vacancy, check if working tomorrow day
    if (day.isFriSat() && resident.canNightSr()) {
        if (day.nightSr.length == 0) {
            if (resident.isAvailableNight(day)) {
                return 'nightSr';
            }
        }
    }

    //if resident can nightJr, check for nightJr vacancy, check if working tomorrow
    if (day.isFriSat() && resident.canJr()) {
        if (day.nightJr.length == 0) {
            if (resident.isAvailableNight(day)) {
                return 'nightJr';
            }
        }
    }

    //if resident can consult, check for consult vacancy
    if (resident.canConsult()) {
        if (day.consult.length == 0) {
            return 'consult';
        }
    }

    //if blue/red, assign to team staff (else assign to smaller team)
    if (resident.team == 'blue') return 'blueStaff';
    else if (resident.team == 'red') return 'redStaff';
    else {
        if (day.blueStaff.length <= day.redStaff.length) return 'blueStaff';
        else residentPosition = 'redStaff';
    }
}
function removeResident(resident, day, position) {

    var residentIndex;

    //locate resident in day[position] array
    for (let i = 0; i < day[position].length; i++) {
        if (day[position][i] == resident) {
            residentIndex = i;
        }
    }

    //remove resident in Day Object
    day[position].splice(residentIndex, 1);

    //remove shifts from resident Object
    unassign(resident, day, position);

    //re-output schedule/stats
    printFullSchedule();

    //update and print stats
    updateStats();
}

function updateStats() {
    clearStats();
    getStats();
    outputStats();
}
function getStats() {

    //structure
    /* [week 0]
     *   [shifts]
     *     [0 shifts] = [Danielle, Tiffany]
     *     [1 shifts] = [Alex, Emily]
     *     [2 shifts] = [Amanda, Ferdi]
     *   [consults]
     *   [weekends]
     *   [nights]
     * [week 1]
     * [week 2]
     * [week 3]
     * 
    */

    var count = 0;
    sortByPGYHigh(residents);
    stats = [];

    //scaffold weekly stats at index 0-3
    for (let week = 0; week < 4; week++) {
        stats[week] = {};
        for (let shiftType of shiftTypes) {
            stats[week][shiftType] = [];
            for (count = 0; count < 8; count++) {
                stats[week][shiftType][count] = [];
            }
        }
    }
    //scaffold overall stats at index 4
    stats[4] = {};
    for (let shiftType of shiftTypes) {
        stats[4][shiftType] = [];
        for (count = 0; count < 31; count++) {
            stats[4][shiftType][count] = [];
        }
    }

    //input weekly stats from resident Objects, unless resident onVacation
    for (let week = 0; week < 4; week++) {
        for (let shiftType of shiftTypes) {
            for (let resident of residents) {
                if (resident.availability[week] == 1) {
                    count = resident[shiftType][week];
                    stats[week][shiftType][count].push(resident);
                }
            }
        }
    }

    //put overall stats at index 4
    for (let resident of residents) {

        //get count if availability isn't zero (convert to averages later as you can't use decimal as index)
        if (resident._availability() > 0) {

            //shifts
            count = resident._shifts();
            stats[4]['shifts'][count].push(resident);

            //consults
            count = resident._consults();
            stats[4]['consults'][count].push(resident);

            //weekends
            count = resident._weekends();
            stats[4]['weekends'][count].push(resident);

            //nights
            count = resident._nights();
            stats[4]['nights'][count].push(resident);
        }
    }
}
function outputStats() {

    var table;
    var row;
    var cell;
    var total;
    var average;
    var first;
    var last;

    //add title Statistics
    document.getElementById('stats-title').innerHTML = 'Statistics';

    //clear stats display
    table = document.getElementById('stats');
    table.innerHTML = '';

    //overall row
    for (let once = 0; once < 1; once++) {

        //headers
        row = document.createElement('tr');
        for (let shiftType of shiftTypes) {
            cell = document.createElement('th');
            cell.innerHTML = 'Overall - ' + shiftType;
            row.append(cell);
        }
        table.append(row);

        //data
        row = document.createElement('tr');
        for (let shiftType of shiftTypes) {
            total = 0;
            cell = document.createElement('td');
            //find first non-blank
            for (let count = 0; count < stats[4][shiftType].length; count++) {
                if (stats[4][shiftType][count].length != 0) {
                    first = count;
                    break;
                }
            }
            //find last non-blank
            for (let count = stats[4][shiftType].length - 1; count >=0 ; count--) {
                if (stats[4][shiftType][count].length != 0) {
                    last = count;
                    break;
                }
            }
            //output
            for (let count = first; count < last+1; count++) {
                cell.innerHTML += count + ': ';
                for (let i = 0; i < stats[4][shiftType][count].length; i++) {
                    let resident = stats[4][shiftType][count][i];
                    if (i != 0) cell.innerHTML += ', ';
                    cell.innerHTML += resident.name;
                    total += count;
                }
                cell.innerHTML += '<br>';
            }
            cell.innerHTML += '<br>Total: ' + total;
            row.append(cell);
        }
        table.append(row);
    }

    //weekly rows
    for (let week = 0; week < 4; week++) {

        //headers
        row = document.createElement('tr');
        for (let shiftType of shiftTypes) {
            cell = document.createElement('th');
            cell.innerHTML = 'Week ' + (week + 1) + ' - ' + shiftType;
            row.append(cell);
        }
        table.append(row);

        //data
        row = document.createElement('tr');
        for (let shiftType of shiftTypes) {
            total = 0;
            cell = document.createElement('td');
            for (let count = 0; count < stats[week][shiftType].length; count++) {
                cell.innerHTML += count + ': ';
                for (let i = 0; i < stats[week][shiftType][count].length; i++) {
                    let resident = stats[week][shiftType][count][i];
                    if (i != 0) cell.innerHTML += ', ';
                    cell.innerHTML += resident.name;
                    total += count;
                }
                cell.innerHTML += '<br>';
            }
            cell.innerHTML += '<br>Total: ' + total;
            row.append(cell);
        }
        table.append(row);
    }

    //averages row
    for (let once = 0; once < 1; once++) {

        //headers
        row = document.createElement('tr');
        for (let shiftType of shiftTypes) {
            cell = document.createElement('th');
            cell.innerHTML = 'Weighted Average - ' + shiftType;
            row.append(cell);
        }
        table.append(row);

        //data
        row = document.createElement('tr');
        for (let shiftType of shiftTypes) {
            total = 0;
            cell = document.createElement('td');
            for (let count = 0; count < stats[4][shiftType].length; count++) {
                average = count / 4;
                cell.innerHTML += average + ': ';
                for (let i = 0; i < stats[4][shiftType][count].length; i++) {
                    let resident = stats[4][shiftType][count][i];
                    if (i != 0) cell.innerHTML += ', ';
                    cell.innerHTML += resident.name;
                    total += average;
                }
                cell.innerHTML += '<br>';
            }
            cell.innerHTML += '<br>Total: ' + total;
            row.append(cell);
        }
        table.append(row);
    }

    //golden weekend row
    for (let once = 0; once < 1; once++) {

        //headers
        row = document.createElement('tr');
        cell = document.createElement('th');
        cell.innerHTML = 'Has Golden Weekend';
        row.append(cell);
        table.append(row);

        //data
        row = document.createElement('tr');
        cell = document.createElement('td');
        residents.sort(byGoldenWeekend);
        for (let resident of residents) {

            if (resident._availability() == 0) continue;

            if (resident.hasGoldenWeekend()) cell.innerHTML += 'Yes: ';
            else cell.innerHTML += '*No: ';
            cell.innerHTML += resident.name;
            total += resident.hasGoldenWeekend();
            cell.innerHTML += '<br>';
        }
        row.append(cell);
        table.append(row);
    }
}

function toggleSidebar() {

    var sidebarElement = document.getElementById('resident-sidebar');
    var sidebarWidth = window.getComputedStyle(sidebarElement).left;

    if (sidebarWidth == '0px') closeSidebar();
    else openSidebar();
}
function openSidebar() {

    var left = 250;

    document.getElementById("resident-sidebar").style.left = '0px';
    document.getElementById("main").style.marginLeft = (left + 10) + 'px';

    document.getElementById('toggleSidebar').innerHTML = '&#9664;';
}
function closeSidebar() {

    var left = 300;

    document.getElementById("resident-sidebar").style.left = '-' + left + 'px';
    document.getElementById("main").style.marginLeft = "0";

    document.getElementById('toggleSidebar').innerHTML = '&#9654;';
}

function exportData() {

    //create singular object to export
    var myData = [residents, month, halfway];

    // Create JSON object
    const jsonData = JSON.stringify(myData);

    // Create a Blob
    const blob = new Blob([jsonData], { type: 'application/json' });

    // Create an <a> element
    const a = document.createElement('a');

    // Create a data URL from the Blob
    const url = URL.createObjectURL(blob);

    // Set the <a> element's attributes
    a.href = url;

    // Default file name
    var now = new Date();
    var nowYear = now.getFullYear();
    var nowMonth = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    var nowDay = String(now.getDate()).padStart(2, '0');
    var nowHours = String(now.getHours()).padStart(2, '0');
    var nowMin = String(now.getMinutes()).padStart(2, '0');
    var nowSec = String(now.getSeconds()).padStart(2, '0');
    var filename = 'autoScheduler_' + `${nowYear}_${nowMonth}_${nowDay}_${nowHours}_${nowMin}_${nowSec}`;
    a.download = filename + '.json';

    // Append the <a> element to the document
    document.body.appendChild(a);

    // Trigger a click on the <a> element
    a.click();

    // Remove the <a> element from the document
    document.body.removeChild(a);

    // Revoke the Object URL to free up resources
    URL.revokeObjectURL(url);
}
function importData(files) {

    const selectedFile = files[0];
    const reader = new FileReader();

    // Define the callback function when the file is loaded
    reader.onload = function (e) {

        const jsonData = JSON.parse(e.target.result);

        // Perform additional actions with the parsed JSON data
        var importedResidents = jsonData[0];
        sortByPGYHigh(importedResidents);
        var importedMonth = jsonData[1];
        var importedHalfway = jsonData[2];

        //Clear residents and teams and schedule
        residents = [];
        blueTeam = [];
        redTeam = [];
        eduTeam = [];
        document.getElementById('all-residents').innerHTML = '';
        clearSchedule();

        

        //convert resident json to Resident class (to access methods)
        for (let i = 0; i < importedResidents.length; i++) {

            residents.push(new Resident(importedResidents[i].name, importedResidents[i].PGY));
            residents[i].team = importedResidents[i].team;
            residents[i].availability = importedResidents[i].availability;
        }

        //output residents HTML
        loadResidents();

        //output teams
        for (let resident of residents) {
            changeDropdown(resident, resident.team);
        }
        
        //make copy of shifts array
        for (let i = 0; i < importedResidents.length; i++) {
            for (let shiftType of shiftTypes) {
                residents[i][shiftType] = importedResidents[i][shiftType];
            }
        }

        //convert month json to Day class (to access methods)
        //convert each scheduled resident json to a pointer to the corresponding resident Object
        month = [];
        for (let num = 0; num < importedMonth.length; num++) {
            month[num] = new Day(num);
            for (let position of positions) {
                for (let dictionary of importedMonth[num][position]) {
                    for (let resident of residents) {
                        if (resident.name == dictionary.name) {
                            month[num][position].push(resident);
                        }
                    }
                }
            }
        }

        //output month
        printFullSchedule();

        //get and output stats
        updateStats();

        //convert halfway JSON
        halfway = importedHalfway;
        loadHalfwayRadio();
        
        
    };

    // Read the contents of the selected file as text
    reader.readAsText(selectedFile);

    
}