//-----------------------------

/* global data */ {
    var month = [];
    var numWeeks = 0;
    var residents = [];
    var blueTeam = [];
    var redTeam = [];
    var eduChief = {};
    var positions = ['blueChief', 'blueStaff', 'redChief', 'redStaff', 'consult', 'nightSr', 'nightJr'];
    var daysOfTheWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var residentProperties = ['name', 'PGY', 'shifts', 'consults', 'weekends', 'nights', 'isEduChief', 'teamColor', 'weekly'];
    var shiftTypes = ['shifts', 'consults', 'weekends', 'nights'];
    var startDate = new Date();
    var stats = {};
}

//-----------------------------

function loadTesting() {

    //output list of residents with full availability
    //assign teams based checkboxes (default full)
    //change dropdown boxes everytime teams are assigned

    //re-assign teams every time availability is changed

    //create assign teams button    

    importResidents();

    setStartDate();

    countTotalSelected();

    setEduChiefRadio();

    setDefaultEduChief();

    assignTeams();

    generateSchedule();
}
function loadPage() {

    openSidebar();

    importResidents();

    setStartDate();

    countTotalSelected();

    setEduChiefRadio();

    setDefaultEduChief();

    assignTeams();
}
function importResidents() {
    //import residents from file to html for selection
    for (let resident of residentsAll) {
        listResident(resident.name, resident.PGY);
    }
}
function setDefaultEduChief() {

    var eduChiefHTML = document.getElementById('chief2');
    if (eduChiefHTML != null) eduChiefHTML.setAttribute("checked", true);

    return;
}
function countTotalSelected() {

    //read selected residents
    var selectedNames = document.querySelectorAll('input[name="resident"]:checked');
    var chiefs = document.getElementById('education-chief');
    chiefs.innerHTML = '';
    var chiefCount = 0;

    //show count of total residents
    var residentCount = document.getElementById('resident-count');
    residentCount.innerHTML = '<br>Available: ' + selectedNames.length;
    document.getElementById('all-residents').append(residentCount);
}
function setEduChiefRadio() {

    //read selected residents
    var selectedNames = document.querySelectorAll('input[name="resident"]:checked');
    var chiefs = document.getElementById('education-chief');
    chiefs.innerHTML = '';
    var chiefCount = 0;

    //create radio input form to select education chief
    for (var i = 0; i < selectedNames.length; i++) {

        var name = selectedNames[i].getAttribute('fName');
        var PGY = selectedNames[i].getAttribute('PGY');

        if (PGY == 5) {
            var input = document.createElement('input');
            input.setAttribute("type", "radio");
            input.setAttribute("id", 'chief' + chiefCount);
            input.setAttribute("name", 'eduChief')
            input.setAttribute("value", name);

            var label = document.createElement('label');
            label.setAttribute("for", 'chief' + chiefCount);
            label.innerHTML = name;

            chiefs.append(input);
            chiefs.append(label);
            chiefs.append(document.createElement('br'));

            chiefCount++;
        }
    }
}
function listResident(argName, argPGY) {

    var name = argName;
    var PGY = argPGY;

    var form = document.getElementById('all-residents');
    var label = document.createElement('label');
    var checkbox = document.createElement('input');
    var span = document.createElement('span');

    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.name = 'resident';
    checkbox.setAttribute('fName', name);
    checkbox.setAttribute('PGY', PGY);
    checkbox.addEventListener('change', countTotalSelected);
    checkbox.addEventListener('change', setEduChiefRadio);

    span.textContent = PGY + ' - ' + name;

    label.appendChild(checkbox);
    label.appendChild(span);
    form.appendChild(label);
    form.appendChild(document.createElement('br'));

}
function setStartDate() {

    var year = 2023;
    var month = 6; //July, months must be 0-11
    var day = 3;

    startDate = new Date(year, month, day);
}

//-----------------------------

function isWorking(argResident, argDay) {

    for (let position of positions) {
        for (let i = 0; i < month[argDay][position].length; i++) {
            if (month[argDay][position][i] == argResident) {
                return true;
            }
        }
    }

    return false;
}
function isWorkingNight(argResident, argDay) {

    //if there was night shift today (ie. today is Fri or Sat), check yesterdays night Sr/Jr
    if (isFriSat(argDay)) {
        if (month[argDay].nightSr.includes(argResident)) return true;
        else if (month[argDay].nightJr.includes(argResident)) return true;
        else return false;
    }
}
function isAvailable(argResident, argDay) {

    if (!isWorking(argResident, argDay) && !isWorkingNight(argResident, argDay-1)) return true;
    else return false;
}
function isEmpty(argResident) {

    if (argResident == null) return true;

    if (Object.keys(argResident) == 0) return true;

    for (let key of residentProperties) {
        if (!argResident.hasOwnProperty(key)) return true;
    }

    return false;
}
function isSatSun(argDay) {
    if (argDay % 7 == 5 || argDay % 7 == 6) return true;
    else return false;
}
function isFriSat(argDay) {
    if (argDay % 7 == 4 || argDay % 7 == 5) return true;
    else return false;
}

//-----------------------------

function getSelectedResidents() {

    getNumWeeks();

    residents = [];
    var residentPool = document.querySelectorAll('input[name="resident"]:checked');
    var name;
    var PGY;

    for (let i = 0; i < residentPool.length; i++) {

        name = residentPool[i].getAttribute('fname');
        PGY = residentPool[i].getAttribute('PGY');

        residents[i] = {};
        residents[i]['name'] = name;
        residents[i]['PGY'] = PGY;
        residents[i]['shifts'] = 0;
        residents[i]['consults'] = 0;
        residents[i]['weekends'] = 0;
        residents[i]['nights'] = 0;
        residents[i]['isEduChief'] = false;
        residents[i]['teamColor'] = 'black';
        residents[i]['weekly'] = {};

        for (let shiftType of shiftTypes) {
            residents[i]['weekly'][shiftType] = [];
            for (let week = 0; week < numWeeks; week++) {
                residents[i]['weekly'][shiftType][week] = 0;
            }
        }
    }

    //assign education chief (if any)
    eduChief = {};
    var eduChiefResults = document.querySelectorAll('input[name="eduChief"]:checked');
    if (eduChiefResults.length > 0) {
        var eduChiefName = eduChiefResults[0].value;
        for (let i = 0; i < residents.length; i++) {
            if (residents[i]['name'] == eduChiefName) {
                eduChief = residents[i];
                residents[i].isEduChief = true;
            }
        }
    }
}
function getNumWeeks() {
    numWeeks = document.getElementById('num-weeks').value;
}
function scaffoldMonth() {

    for (let week = 0; week < numWeeks; week++) {
        for (let day = (week * 7); day < (week * 7) + 7; day++) {
            month[day] = {};
            for (let position of positions) {
                month[day][position] = [];
            }
        }
    }
}
function assignTeams() {

    getSelectedResidents();

    sortByPGYHigh(residents);

    blueTeam = [];
    redTeam = [];

    for (let resident of residents) {

        //assign one chief to each team, exclude eduChief
        if (resident.PGY == 5) {
            if (resident != eduChief) {
                if (blueTeam.length <= redTeam.length) pushBlue(resident);
                else pushRed(resident);
            }
        }

        //even out team size
        else if (blueTeam.length < redTeam.length) pushBlue(resident);
        else if (blueTeam.length > redTeam.length) pushRed(resident);

        //each team should have at least one resident from each PGY
        else {
            if (resident.PGY != blueTeam[blueTeam.length - 1].PGY) pushBlue(resident);
            else if (resident.PGY != redTeam[redTeam.length - 1].PGY) pushRed(resident);
            else pushBlue(resident);
        }
    }
}
function pushBlue(argResident) {
    blueTeam.push(argResident);
    argResident.teamColor = 'blue';
}
function pushRed(argResident) {
    redTeam.push(argResident);
    argResident.teamColor = 'red';
}
function populateMonth() {

    for (let week = 0; week < numWeeks; week++) {

        //1. assign weekday chiefs
        for (let day = week * 7; day < (week * 7) + 5; day++) {
            month[day]['blueChief'].push(assignShift(chooseChief(blueTeam), day));
            month[day]['redChief'][0] = assignShift(chooseChief(redTeam), day);
        }

        //2. assign weekend chiefs (always edu chief and one 4th year)
        for (let day = (week * 7) + 5; day < (week * 7) + 7; day++) {
            month[day]['blueChief'][0] = assignWeekend(chooseChiefWeekend(blueTeam, day), day);
            month[day]['redChief'][0] = assignWeekend(chooseChiefWeekend(redTeam, day), day);
        }

        //3. assign night seniors & night juniors. No 24 hours shifts. NightSr is non weekend 4th year or 3rd year)
        for (let day = (week * 7) + 4; day < (week * 7) + 6; day++) {
            month[day]['nightSr'][0] = assignNight(chooseNightSr(residents, day), day);
            month[day]['nightJr'][0] = assignNight(chooseNightJr(residents, day), day);
        }

        //4. assign weekend staff
        for (let day = (week * 7) + 5; day < (week * 7) + 7; day++) {
            month[day]['blueStaff'][0] = assignWeekend(chooseWeekend(blueTeam, day), day);
            month[day]['redStaff'][0] = assignWeekend(chooseWeekend(redTeam, day), day);
        }

        //5. assign consults
        for (let day = week * 7; day < (week * 7) + 7; day++) {
            if (isEmpty(month[day].consult)) month[day]['consult'][0] = assignConsult(chooseConsult(residents, day), day);
        }

        //5. assign week day shifts
        for (let day = week * 7; day < (week * 7) + 5; day++) {

            //seniors
            month[day]['blueStaff'][0] = assignShift(chooseSr(blueTeam, day), day);
            month[day]['redStaff'][0] = assignShift(chooseSr(redTeam, day), day);

            //juniors
            month[day]['blueStaff'][1] = assignShift(chooseJr(blueTeam, day), day);
            month[day]['redStaff'][1] = assignShift(chooseJr(redTeam, day), day);
        }
    }
}

//-----------------------------

function printFullSchedule() {

    var schedule;
    var week;

    //clear schedule
    schedule = document.getElementById('schedule');
    schedule.innerHTML = "";

    for (let weekNum = 0; weekNum < numWeeks; weekNum++) {
        week = makeWeek(weekNum);
        schedule.append(week);
    }
}
function makeWeek(argWeekNum) {

    var week;
    var dateRow;
    var assignmentRow;
    var floatPoolRow;

    //create week container
    week = document.createElement('div');

    //create date/day headers row
    dateRow = makeDateRow(argWeekNum);
    week.append(dateRow);

    //create assignments row
    assignmentRow = makeAssignmentsRow(argWeekNum);
    week.append(assignmentRow);

    //create float pool row
    floatPoolRow = makeFloatPoolRow(argWeekNum);
    week.append(floatPoolRow);

    return week;
}
function makeDateRow(argWeek) {

    var row;
    var cell;

    row = document.createElement('tr');

    for (let day = 0; day < daysOfTheWeek.length; day++) {
        cell = makeDateCell(argWeek, day);
        row.append(cell);
    }

    return row;
}
function makeDateCell(argWeek, argDay) {

    var cell;
    var dayName;
    var date = new Date(startDate);

    dayName = daysOfTheWeek[argDay];
    date.setDate(startDate.getDate() + argDay + (argWeek * 7));

    cell = document.createElement('th');
    cell.innerHTML += date.getMonth() + 1 + '/' + date.getDate();
    cell.innerHTML += '&nbsp;&nbsp;';
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
function makeAssignmentCell(argWeek, argDay) {

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
    cell.setAttribute('id', 'day' + argDay);

    //wrapper scaffold - need single element to align colums to top of cell
    wrapper = document.createElement('div');
    wrapper.setAttribute('class', 'wrapper');

    //scaffold positions column
    positionsColumn = document.createElement('div');
    //positionsColumn.setAttribute('id', 'day' + argDay + '-positions');
    positionsColumn.setAttribute('class', 'position-column');
    wrapperTeams = document.createElement('div');
    wrapperTeams.setAttribute('class', 'wrapper-teams');
    //wrapperTeams.setAttribute('id', 'day' + argDay + '-wrapper-teams')
    wrapperSpecial = document.createElement('div');
    wrapperSpecial.setAttribute('class', 'wrapper-special');
    //wrapperSpecial.setAttribute('id', 'day' + argDay + '-wrapper-special');
    positionsColumn.append(wrapperTeams, wrapperSpecial);

    //scaffold names column
    namesColumn = document.createElement('div');
    namesColumn.setAttribute('id', 'day' + argDay + '-names');
    namesColumn.setAttribute('class', 'name-column');

    wrapperTeams.innerHTML = '';
    wrapperSpecial.innerHTML = '';
    namesColumn.innerHTML = '';

    //output each position
    for (let position of positions) {
        for (let i = 0; i < month[argDay][position].length; i++) {

            let resident = month[argDay][position][i];

            if (!isEmpty(resident)) {

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
                nameHTML.addEventListener('click', () => removeResident(resident, argDay));

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
function makeFloatPoolRow(argWeek) {

    var row;
    var cell;
    var floatPool = {};
        floatPool['blue'];
        floatPool['red'];
        floatPool['black'];
    var teamColors = ['blue', 'red', 'black'];
    var residentHTML;
    var tooltipHTML;

    row = document.createElement('tr');
    for (let day = (argWeek * 7); day < (argWeek * 7) + 7; day++) {
        cell = document.createElement('td');
        cell.innerHTML = '';
        cell.setAttribute('id', 'day' + day + '-floatPool');

        cell.innerHTML += 'Float Pool<br>';

        floatPool['blue'] = [];
        floatPool['red'] = [];
        floatPool['black'] = [];

        //find all available residents and separate based on team
        for (let resident of residents) {
            if (isAvailable(resident, day)) {
                floatPool[resident.teamColor].push(resident);
            }
        }

        //sort float pools by shifts this week
        for (let teamColor of teamColors) {
            sortByShiftsThisWeek(floatPool[teamColor], argWeek);
        }

        //output by team with specific text color
        for (let teamColor of teamColors) {
            for (let resident of floatPool[teamColor]) {

                residentHTML = document.createElement('div');
                residentHTML.innerHTML = '';
                residentHTML.innerHTML = resident.name;
                residentHTML.innerHTML += ' (' + resident.weekly.shifts[argWeek] + ')';
                residentHTML.setAttribute('class', resident.teamColor + '-text resident ' + resident.name);
                residentHTML.addEventListener('click', () => addResident(resident, day));
                residentHTML.addEventListener('mouseover', () => mouseOver(resident.name));
                residentHTML.addEventListener('mouseout', () => mouseOut(resident.name));

                tooltipHTML = makeToolTip(resident, argWeek);
                residentHTML.append(tooltipHTML);

                cell.append(residentHTML);
            }
        }
        row.append(cell);
    }

    return row;
}
function makeToolTip(argResident, argWeek) {

    var tooltip;

    tooltip = document.createElement('span');
    tooltip.setAttribute('class', 'tooltip');
    tooltip.innerHTML += 'shifts this week: ' + argResident.weekly.shifts[argWeek] + '<br>';
    tooltip.innerHTML += 'total shifts: ' + argResident.shifts + '<br>';
    tooltip.innerHTML += 'consults: ' + argResident.consults + '<br>';
    tooltip.innerHTML += 'weekends: ' + argResident.weekends + '<br>';
    tooltip.innerHTML += 'nights: ' + argResident.nights + '<br>';

    return tooltip;
}

//-----------------------------

function sortByPGYHigh(argResidents) {

    argResidents.sort(function (low, high) {

        if (low.PGY == high.PGY) {

            return Math.random() - 0.5;
        }

        return high.PGY - low.PGY;
    })
}
function sortByShifts(argResidents) {

    argResidents.sort(function (low, high) {
        if (low.shifts == high.shifts) return low.PGY - high.PGY;
        else return low.shifts - high.shifts;
    })
}
function sortByConsults(argResidents) {

    argResidents.sort(function (low, high) {

        if (low.consults == high.consults) {

            return low.PGY - high.PGY;
        }

        return low.consults - high.consults;
    })
}
function sortByWeekends(argResidents) {

    argResidents.sort(function (low, high) {

        if (low.weekends == high.weekends) {

            return low.shifts - high.shifts;
        }

        return low.weekends - high.weekends;
    })
}
function sortByNights(argResidents) {

    argResidents.sort(function (low, high) {

        if (low.nights == high.nights) {

            return low.shifts - high.shifts;
        }

        return low.nights - high.nights;
    })
}
function sortByShiftsThisWeek(argResidents, argWeek) {

    argResidents.sort(function (low, high) {
        if (low.weekly.shifts[argWeek] == high.weekly.shifts[argWeek]) return low.shifts - high.shifts;
        else return low.weekly.shifts[argWeek] - high.weekly.shifts[argWeek];
    })
}

//-----------------------------

function canChief(argResident) {
    if (argResident.PGY == 5) return true;
    else return false;
}
function canJr(argResident) {

    if (argResident.PGY < 3) return true;
    else return false;
}
function canSr(argResident) {

    if (argResident.PGY > 2) return true;
    else return false;
}
function canConsult(argResident) {

    if (argResident.PGY > 1 && argResident.PGY < 5) return true;
    else return false;
}
function canChiefWeekend(argResident) {

    if (argResident.PGY == 4 || argResident.isEduChief) return true;
    else return false;
}
function canNightSr(argResident) {

    if (argResident.PGY == 3 || argResident.PGY == 4) return true;
    else return false;
}

//-----------------------------

function chooseChief(argTeam) {

    for (let i = 0; i < argTeam.length; i++) {
        if (argTeam[i].PGY == 5) return argTeam[i];
    }

    return {};
}
function chooseSr(argTeam, argDay) {

    sortByShifts(argTeam);

    for (let resident of argTeam) {
        if (canSr(resident) && isAvailable(resident, argDay)) return resident;
    }

    return {};
}
function chooseJr(argTeam, argDay) {

    sortByShifts(argTeam);

    for (let resident of argTeam) {
        if (canJr(resident) && isAvailable(resident, argDay)) return resident;
    }

    return {};
}
function chooseConsult(argTeam, argDay) {

    sortByConsults(argTeam);

    for (let resident of argTeam) {
        if (canConsult(resident) && isAvailable(resident, argDay)) return resident;
    }

    return {};

}
function chooseChiefWeekend(argTeam, argDay) {

    //if Sunday, keep weekend senior same as Sat
    if (argDay % 7 == 6) {
        if (argTeam == blueTeam) return month[argDay - 1]['blueChief'][0];
        else if (argTeam == redTeam) return month[argDay - 1]['redChief'][0];
        else return {};
    }
    //should education chief be weekend senior? (based on team + even/odd week)
    if (!isEmpty(eduChief)) {
        if (argTeam == blueTeam && (Math.trunc(argDay / 7)) % 2 == 0) return eduChief;
        if (argTeam == redTeam && (Math.trunc(argDay / 7)) % 2 == 1) return eduChief;
    }
    //otherwise determine 4th year weekend senior
    sortByWeekends(argTeam);
    for (let resident of argTeam) {
        if (canChiefWeekend(resident) && isAvailable(resident, argDay)) return resident;
    }

    return {};
}
function chooseWeekend(argTeam, argDay) {

    sortByWeekends(argTeam);

    for (let resident of argTeam) {
        if (canJr(resident) && isAvailable(resident, argDay)) return resident;
    }

    return {};
}
function chooseNightSr(argTeam, argDay) {

    var weekendChiefs = [];
    var blueWeekendChief;
    var redWeekendChief;
    var pool = [];

    //find weekend chiefs
    blueWeekendChief = month[argDay + 1]['blueChief'][0];
    if (!isEmpty(blueWeekendChief)) weekendChiefs.push(blueWeekendChief);
    redWeekendChief = month[argDay + 1]['redChief'][0];
    if (!isEmpty(redWeekendChief)) weekendChiefs.push(redWeekendChief);

    //find all possible night seniors
    for (let resident of argTeam) {
        if (canNightSr(resident) && !weekendChiefs.includes(resident)) pool.push(resident);
    }

    //choose from all candidates, ok to work 2 nights in a row if needed
    sortByNights(pool);
    for (let resident of pool) {
        if (!isWorking(resident, argDay)) return resident;
    }

    return {};
}
function chooseNightJr(argTeam, argDay) {

    sortByNights(argTeam);

    //ok to work 2 nights in a row
    for (let resident of argTeam) {
        if (canJr(resident) && !isWorking(resident, argDay)) return resident;
    }

    return {};
}

//-----------------------------

function assignShift(argResident, argDay) {

    if (!isEmpty(argResident)) {
        var week = Math.trunc(argDay / 7);
        argResident.shifts += 1;
        argResident.weekly.shifts[week] += 1;

        return argResident;
    }

    else return {};
}
function assignConsult(argResident, argDay) {

    if (!isEmpty(argResident)) {
        var week = Math.trunc(argDay / 7);
        argResident.consults += 1;
        argResident.weekly.consults[week] += 1;
    }

    return assignShift(argResident, argDay);
}
function assignWeekend(argResident, argDay) {

    if (!isEmpty(argResident)) {
        var week = Math.trunc(argDay / 7);
        argResident.weekends += 1;
        argResident.weekly.weekends[week] += 1;
    }

    return assignShift(argResident, argDay);
}
function assignNight(argResident, argDay) {

    if (!isEmpty(argResident)) {
        var week = Math.trunc(argDay / 7);
        argResident.nights += 1;
        argResident.weekly.nights[week] += 1;
    }

    return assignWeekend(argResident, argDay);
}
function unassign(argResident, argDay, argPosition) {

    var week = Math.trunc(argDay / 7);

    argResident.shifts -= 1;
    argResident.weekly.shifts[week] -= 1;

    if (argPosition == 'consult') {
        argResident.consults -= 1;
        argResident.weekly.consults[week] -= 1;
    }

    if (argDay % 7 == 5 || argDay % 7 == 6) {
        argResident.weekends -= 1;
        argResident.weekly.weekends[week] -= 1;
    }

    if (argPosition.includes('night')) {
        argResident.nights -= 1;
        argResident.weekly.nights[week] -= 1;
    }
}

//-----------------------------

function generateSchedule() {

    scaffoldMonth();

    populateMonth();

    printFullSchedule();

    getStats();

    outputStats();
}

//-----------------------------

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

//-----------------------------

function getStats() {

    //example structure
    /* [shifts]
     *   [week 0]
     *     [0 shifts]
     *       [Danielle, Tiffany]
     *     [1 shifts]
     *       [Alex, Emily]
     *     [2 shifts]
     *       [Amanda, Ferdi]
     *   [week 1]
     *   [week 2]
     *   [week 3]
     * [consults]
     * [weekends]
     * [nights]
    */

    var count;
    stats = {}; 

    for (let shiftType of shiftTypes) {
        stats[shiftType] = [];
        for (let week = 0; week < numWeeks; week++) {
            stats[shiftType][week] = [];
            for (let i = 0; i < 8; i++) {
                stats[shiftType][week][i] = [];
            }
            for (let resident of residents) {
                count = resident.weekly[shiftType][week];
                stats[shiftType][week][count].push(resident);
            }
        }
    }
}
function outputStats() {

    var table;
    var row;
    var cell;
    var total;

    //add title Statistics
    document.getElementById('stats-title').innerHTML = 'Statistics';

    table = document.getElementById('stats');
    table.innerHTML = '';


    for (let week = 0; week < numWeeks; week++) {

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
            for (let count = 0; count < stats[shiftType][week].length; count++) {
                cell.innerHTML += count + ': ';
                for (let i = 0; i < stats[shiftType][week][count].length; i++) {
                    let resident = stats[shiftType][week][count][i];
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

}

//-----------------------------

function removeResident(argResident, argDay) {

    var residentPosition;
    var residentIndex;

    //locate resident in day/position
    for (let position of positions) {
        for (let i = 0; i < month[argDay][position].length; i++) {
            if (month[argDay][position][i] == argResident) {
                residentPosition = position;
                residentIndex = i;
            }
        }
    }

    //remove resident
    month[argDay][residentPosition].splice(residentIndex, 1);

    //unassign resident
    unassign(argResident, argDay, residentPosition);

    //re-output schedule/stats
    printFullSchedule();
    getStats();
    outputStats();
}
function choosePosition(argResident, argDay) {

    //choose what position to place resident
    var teamColor = argResident.teamColor;

    //if resident can be chief or weekend chief, check for chief vacancy
    if (canChief(argResident) || (isSatSun(argDay) && canChiefWeekend(argResident))) {
        if (teamColor == 'blue' || teamColor == 'black') {
            if (isEmpty(month[argDay]['blueChief'][0])) return 'blueChief';
        }
        else if (teamColor == 'red' || teamColor == 'black') {
            if (isEmpty(month[argDay]['redChief'][0])) return 'redChief';
        }
    }
    
    //if resident can nightSr, check for nightSr vacancy, check if working tomorrow
    if (isFriSat(argDay) && canNightSr(argResident)) {
        if (isEmpty(month[argDay]['nightSr'][0])) {
            if (!isWorking(argResident, argDay + 1) || isWorkingNight(argResident, argDay + 1)) {
                return 'nightSr';
            }
        }
    }

    //if resident can nightJr, check for nightJr vacancy, check if working tomorrow
    if (isFriSat(argDay) && canJr(argResident)) {
        if (isEmpty(month[argDay]['nightJr'][0])) {
            if (!isWorking(argResident, argDay + 1) || isWorkingNight(argResident, argDay + 1)) {
                return 'nightJr';
            }
        }
    }

    //if resident can consult, check for consult vacancy
    if (canConsult(argResident)) {
        if (isEmpty(month[argDay]['consult'][0])) {
            return 'consult';
        }
    }

    //else assign to blue/red staff (if eduChief, assign to smaller team)
    if (teamColor == 'blue') return 'blueStaff';
    if (teamColor == 'red') return 'redStaff';
    if (teamColor == 'black') {
        if (month[argDay]['blueStaff'].length <= month[argDay]['redStaff'].length) return 'blueStaff';
        else residentPosition = 'redStaff';
    }
}
function addResident(argResident, argDay) {

    var residentPosition;

    //choose what position to place resident
    residentPosition = choosePosition(argResident, argDay);

    //add to that position
    if (residentPosition.includes('night')) month[argDay][residentPosition].push(assignNight(argResident, argDay));
    else if (isSatSun(argDay)) month[argDay][residentPosition].push(assignWeekend(argResident, argDay));
    else if (residentPosition.includes('consult')) month[argDay][residentPosition].push(assignConsult(argResident, argDay));
    else month[argDay][residentPosition].push(assignShift(argResident, argDay));

    //re-output schedule/stats
    printFullSchedule();
    getStats();
    outputStats();
}
function mouseOver(argClass) {
    const elementsToBold = document.querySelectorAll('.'+argClass);
    elementsToBold.forEach(element => {
        element.style.fontWeight = "bold";
    });
}
function mouseOut(argClass) {
    const elementsToUnBold = document.querySelectorAll('.' + argClass);
    elementsToUnBold.forEach(element => {
        element.style.fontWeight = "normal";
    });
}