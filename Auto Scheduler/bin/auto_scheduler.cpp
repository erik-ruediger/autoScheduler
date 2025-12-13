
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <deque>
#include <list>
#include <algorithm>
#include <random>
#include <chrono>
using namespace std;

class Resident {
public:
	string name;
	int PGY;
	int shifts;
	int consults;
	int weekends;
	int nights;
	bool isEduChief;

	Resident(string argName, int argPGY);
	~Resident();

	bool canSr();
	bool canSrWeekend();
	bool canSrNight();
	bool canJr();
	bool canConsult();
};

class Day {
public:
	Resident* red5;
	Resident* redSr;
	Resident* redJr;

	Resident* blue5;
	Resident* blueSr;
	Resident* blueJr;

	Resident* consult;

	Resident* callSr;
	Resident* callJr;

	Day();

	void print(int argDay, string argIndent = "");
	bool isWorking(Resident* argR);
	bool isCall(Resident* argR);
};

class Cohort {
public:
	list<Resident*> rList;
	string teamName;

	Cohort(string argTeamName = "");

	void add(string argName, int argPGY);
	void deallocate();

	void sortByPGYhigh();
	void sortByShifts();
	void sortByConsults();
	void sortByWeekends();
	void sortByNights();
	int size();
};

bool comparePGYhigh(Resident* argL, Resident* argR);
bool compareShifts(Resident* argL, Resident* argR);
bool compareConsults(Resident* argL, Resident* argR);
bool compareWeekends(Resident* argL, Resident* argR);
bool compareNights(Resident* argL, Resident* argR);

bool callYesterday(Resident* argResident, vector<Day>& argMonth, const int argDay);

void divideTeams(Cohort& argAll, Cohort& argBlueTeam, Cohort& argRedTeam, Resident* argEduChief);
Resident* designateEduChief(Cohort& argAll, string argName);

Resident* chooseChief(Cohort& argTeam);
Resident* chooseSr(Cohort& argTeam, vector<Day>& argMonth, const int argDay);
Resident* chooseJr(Cohort& argTeam, vector<Day>& argMonth, const int argDay);
Resident* chooseConsult(Cohort& argTeam, vector<Day>& argMonth, const int argDay);
Resident* chooseCallSr(Cohort& argAll, vector<Day>& argMonth, const int argDay);
Resident* chooseCallJr(Cohort& argAll, vector<Day>& argMonth, const int argDay);
Resident* chooseSrWeekend(Cohort& argTeam, vector<Day>& argMonth, const int argDay, Resident* argEduChief);

Resident* assignShift(Resident* argResident);
Resident* assignConsult(Resident* argResident);
Resident* assignWeekend(Resident* argResident);
Resident* assignCall(Resident* argResident);

void printMonth(vector<Day>& argMonth, string argIndent = "");
void printNumShifts(Cohort& residents);

string outputName(Resident* argResident);
void outputMonth(vector<Day>& argMonth, string argFileName);

int main() {

	Cohort onService;
	string eduChiefName = "Josh";
	{
		onService.add("Brian",    5);
		onService.add("Jason",    5);
		onService.add("Josh",     5);

		onService.add("Jacob",    4);
		onService.add("Julia",    4);
		onService.add("Natalie",  4);

		onService.add("Amanda",   3);
		onService.add("Ben",      3);
		//onService.add("Ferdi",    3);

		onService.add("Alex",     2);
		//onService.add("Emily",    2);
		onService.add("Rachel",   2);

		onService.add("Danielle", 1);
		onService.add("Rukia",    1);
		onService.add("Taylor",   1);
		//onService.add("Tiffany",  1);
		//onService.add("Vicky",    1);
	}

	Cohort blueTeam("blue");
	Cohort redTeam("red");
	Resident* eduChief = designateEduChief(onService, eduChiefName);
	divideTeams(onService, blueTeam, redTeam, eduChief);
	vector<Day> month(28);
	int numWeeks = month.size() / 7;
	bool alternateWeeks;
	int Fri;
	int Sat;
	int Sun;
	
	for (int week = 0; week < numWeeks; week++) {

		//priority assignments:
		
		//1. assign weekday chiefs
		for (int day = week * 7; day < (week * 7 + 5); day++) {
			Day* today = &month[day];
			today->blue5 = assignShift(chooseChief(blueTeam));
			today->red5 = assignShift(chooseChief(redTeam));
		}

		//2. assign weekend seniors (always edu chief and one 4th year)
		Fri = (week * 7) + 4;
		Sat = (week * 7) + 5;
		Sun = (week * 7) + 6;
		for (int day = Sat; day <= Sun; day++) {
			month[day].blueSr = assignWeekend(chooseSrWeekend(blueTeam, month, day, eduChief));
			month[day].redSr = assignWeekend(chooseSrWeekend(redTeam, month, day, eduChief));
		}

		//3. assign call seniors (non weekend 4th year, 3rd year) and call juniors. No 24 hours shifts
		for (int day = Fri; day < Sun; day++) {
			month[day].callSr = assignCall(chooseCallSr(onService, month, day));
			month[day].callJr = assignCall(chooseCallJr(onService, month, day));
		}

		//4. assign remainder of shifts
		for (int day = week * 7; day < (week * 7 + 7); day++) {

			Day* today = &month[day];

			//seniors
			if (today->blueSr == nullptr) today->blueSr = assignShift(chooseSr(blueTeam, month, day));
			if (today->redSr == nullptr) today->redSr = assignShift(chooseSr(redTeam, month, day));

			//juniors
			if (today->blueJr == nullptr) today->blueJr = assignShift(chooseJr(blueTeam, month, day));
			if (today->redJr == nullptr) today->redJr = assignShift(chooseJr(redTeam, month, day));

			//consult
			if (today->consult == nullptr) today->consult = assignConsult(chooseConsult(onService, month, day));
		}
	}

	printMonth(month);
	cout << "\n";
	printNumShifts(onService);

	outputMonth(month, "schedule.tsv");

	//memory management
	onService.deallocate();

	return 0;
}

Day::Day()
{
	blue5 = nullptr;
	blueSr = nullptr;
	blueJr = nullptr;
	red5 = nullptr;
	redSr = nullptr;
	redJr = nullptr;
	consult = nullptr;
	callSr = nullptr;
	callJr = nullptr;
}
void Day::print(int argDay, string argIndent)
{
	int day = argDay % 7;
	string dayName[] = { "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun" };
	cout << argIndent << dayName[day] << "\n";
	
	argIndent += "  ";

	/*blue team*/ {
		
		cout << argIndent << "blue team: ";

		if (day != 5 && day != 6) {
			if (blue5 != nullptr) cout << blue5->name;
			else cout << "NULL";
			cout << ", ";
		}

		if (blueSr != nullptr) cout << blueSr->name;
		else cout << "NULL";
		cout << ", ";

		if (blueJr != nullptr) cout << blueJr->name;
		else cout << "NULL";
		cout << "\n";
	}

	/*red team*/ {

		cout << argIndent << "red team: ";

		if (day != 5 && day != 6) {
			if (red5 != nullptr) cout << red5->name;
			else cout << "NULL";
			cout << ", ";
		}

		if (redSr != nullptr) cout << redSr->name;
		else cout << "NULL";
		cout << ", ";

		if (redJr != nullptr) cout << redJr->name;
		else cout << "NULL";
		cout << "\n";
	}

	/*consult*/ {

		cout << argIndent << "consult: ";

		if (consult != nullptr) cout << consult->name;
		else cout << "NULL";
		cout << "\n";
	}

	/*call*/ {

		if (day==4 || day == 5) {

			cout << argIndent << "call: ";

			if (callSr != nullptr) cout << callSr->name;
			else cout << "NULL";
			cout << ", ";

			if (callJr != nullptr) cout << callJr->name;
			else cout << "NULL";
			cout << "\n";
		}
	}
}
bool Day::isWorking(Resident* argR)
{
	if (blue5 == argR) return true;
	else if (blueSr == argR) return true;
	else if (blueJr == argR) return true;
	else if (red5 == argR) return true;
	else if (redSr == argR) return true;
	else if (redJr == argR) return true;
	else if (consult == argR) return true;
	else if (callSr == argR) return true;
	else if (callJr == argR) return true;

	else return false;
}
bool Day::isCall(Resident* argR)
{
	if (callSr == argR) return true;
	else if (callJr == argR) return true;

	else return false;
}

Resident::Resident(string argName, int argPGY)
{
	name = argName;
	PGY = argPGY;
	shifts = 0;
	consults = 0;
	weekends = 0;
	nights = 0;
	isEduChief = false;
}
Resident::~Resident()
{
}
bool Resident::canSr()
{
	if (PGY > 2) return true;
	else return false;
}
bool Resident::canSrWeekend()
{
	if (PGY == 4 || isEduChief) {
		return true;
	}

	else return false;
}
bool Resident::canSrNight()
{
	if (PGY == 3 || PGY == 4) {
		return true;
	}

	else return false;
}
bool Resident::canJr()
{
	if (PGY < 3) return true;
	else return false;
}
bool Resident::canConsult()
{
	if (PGY > 1 && PGY < 5) return true;
	else return false;
}

Cohort::Cohort(string argTeamName)
{
	teamName = argTeamName;
}
void Cohort::add(string argName, int argPGY)
{
	rList.push_back(new Resident(argName, argPGY));
}
void Cohort::deallocate()
{
	while (!rList.empty()) {
		delete rList.front();
		rList.pop_front();
	}
}
void Cohort::sortByPGYhigh()
{
	//random order within same year

	rList.sort(comparePGYhigh);
	list<Resident*> initial = rList;
	deque<Resident*> randomizer;
	list<Resident*> final;
	int curPGY;

	while (!initial.empty()) {
		curPGY = initial.front()->PGY;
		while (!initial.empty() && curPGY == initial.front()->PGY) {
			randomizer.push_back(initial.front());
			initial.pop_front();
		}
		unsigned seed = chrono::system_clock::now().time_since_epoch().count();
		shuffle(randomizer.begin(), randomizer.end(), default_random_engine(seed));
		while (!randomizer.empty()) {
			final.push_back(randomizer.front());
			randomizer.pop_front();
		}
	}

	rList = final;
}
void Cohort::sortByShifts()
{
	rList.sort(compareShifts);
}
void Cohort::sortByConsults()
{
	rList.sort(compareConsults);
}
void Cohort::sortByWeekends()
{
	rList.sort(compareWeekends);
}
void Cohort::sortByNights()
{
	rList.sort(compareNights);
}
int Cohort::size()
{
	return int(rList.size());
}

bool comparePGYhigh(Resident* argL, Resident* argR)
{
	if (argL->PGY == argR->PGY) {
		return (argL->name < argR->name);
	}

	else return !(argL->PGY < argR->PGY);
}
bool compareShifts(Resident* argL, Resident* argR)
{
	if (argL->shifts == argR->shifts) return (argL->PGY < argR->PGY);

	else return (argL->shifts < argR->shifts);
}
bool compareConsults(Resident* argL, Resident* argR) {
	
	if (argL->consults == argR->consults) return (argL->PGY < argR->PGY);

	else return (argL->consults < argR->consults);
}
bool compareWeekends(Resident* argL, Resident* argR)
{
	if (argL->weekends == argR->weekends) return (argL->shifts < argR->shifts);

	else return (argL->weekends < argR->weekends);
}
bool compareNights(Resident* argL, Resident* argR)
{
	if (argL->nights == argR->nights) return (argL->shifts < argR->shifts);

	else return (argL->nights < argR->nights);
}

bool callYesterday(Resident* argResident, vector<Day>& argMonth, const int argDay)
{
	//if there was call shift yesterday (today is Sat or Sun)
	if (argDay % 7 == 5 || argDay % 7 == 6) {
		if (argMonth[argDay - 1].isCall(argResident)) {
			return true;
		}
	}
	
	return false;
}

Resident* designateEduChief(Cohort& argAll, string argName)
{
	for (Resident* resident : argAll.rList) {
		if (resident->name == argName) {
			resident->isEduChief = true;
			return resident;
		}
	}

	return nullptr;
}
void divideTeams(Cohort& argAll, Cohort& argBlueTeam, Cohort& argRedTeam, Resident* argEduChief)
{
	//PGY high to low, randomized within year
	Cohort all = argAll;
	all.sortByPGYhigh();

	//assign 1 chief to each team, do NOT assign edu chief at all
	list<Resident*> chiefs;
	while (all.rList.front()->PGY == 5) {
		if(all.rList.front() != argEduChief) chiefs.push_back(all.rList.front());
		all.rList.pop_front();
	}
	argBlueTeam.rList.push_back(chiefs.front());
	argRedTeam.rList.push_back(chiefs.back());

	//try to assign at least 1 resident from each PGY to each team
	while (!all.rList.empty()) {

		if (argBlueTeam.size() < argRedTeam.size()) {
			argBlueTeam.rList.push_back(all.rList.front());
		}
		else if (argRedTeam.size() > argBlueTeam.size()) {
			argRedTeam.rList.push_back(all.rList.front());
		}
		else {
			if (all.rList.front()->PGY != argBlueTeam.rList.back()->PGY) {
				argBlueTeam.rList.push_back(all.rList.front());
			}
			else if (all.rList.front()->PGY != argRedTeam.rList.back()->PGY) {
				argRedTeam.rList.push_back(all.rList.front());
			}
			else {
				argBlueTeam.rList.push_back(all.rList.front());
			}
		}
		
		all.rList.pop_front();
	}
}
Resident* chooseChief(Cohort& argTeam)
{
	for (Resident* resident : argTeam.rList) {
		if (resident->PGY == 5) {
			return resident;
		}
	}
	return nullptr;
}
Resident* chooseSr(Cohort& argTeam, vector<Day>& argMonth, const int argDay)
{
	argTeam.sortByShifts();

	for (Resident* resident : argTeam.rList) {
		if (resident->canSr()) {
			if (!callYesterday(resident, argMonth, argDay)) {
				if (!argMonth[argDay].isWorking(resident)) return resident;
			}
		}
	}

	return nullptr;
}
Resident* chooseJr(Cohort& argTeam, vector<Day>& argMonth, const int argDay)
{
	argTeam.sortByShifts();

	for (Resident* resident : argTeam.rList) {
		if (resident->canJr()) {
			if (!callYesterday(resident, argMonth, argDay)) {
				if (!argMonth[argDay].isWorking(resident)) return resident;
			}
		}
	}

	return nullptr;
}
Resident* assignShift(Resident* argResident)
{
	if (argResident!= nullptr) argResident->shifts += 1;
	return argResident;
}
Resident* chooseConsult(Cohort& argTeam, vector<Day>& argMonth, const int argDay)
{
	argTeam.sortByConsults();

	for (Resident* resident : argTeam.rList) {
		if (resident->canConsult()) {
			if (!callYesterday(resident, argMonth, argDay)) {
				if (!argMonth[argDay].isWorking(resident)) return resident;
			}
		}
	}

	return nullptr;
}
Resident* assignConsult(Resident* argResident)
{
	if (argResident != nullptr) argResident->consults += 1;
	return assignShift(argResident);
}
Resident* chooseCallJr(Cohort& argAll, vector<Day>& argMonth, const int argDay)
{
	argAll.sortByNights();

	for (Resident* resident : argAll.rList) {
		if (resident->canJr()) {
			if (!argMonth[argDay].isWorking(resident)) return resident;
		}
	}

	return nullptr;
}
Resident* chooseSrWeekend(Cohort& argTeam, vector<Day>& argMonth, const int argDay, Resident* argEduChief)
{
	//if Sunday, keep weekend senior same as Sat
	if (argDay % 7 == 6) {
		if (argTeam.teamName == "blue") {
			return argMonth[argDay - 1].blueSr;
		}
		else if (argTeam.teamName == "red") {
			return argMonth[argDay - 1].redSr;
		}
		else return nullptr;
	}

	//determine if education chief is weekend senior (based on team + week)
	int week = argDay / 7;
	bool alternateWeeks = week % 2;
	bool takeEduChief;

	if (argTeam.teamName == "blue")	takeEduChief = alternateWeeks;
	else if (argTeam.teamName == "red") takeEduChief = !alternateWeeks;
	else return nullptr;

	if (takeEduChief) return argEduChief;

	//otherwise determine 4th year weekend senior
	argTeam.sortByWeekends();

	for (Resident* resident : argTeam.rList) {
		if (resident->canSrWeekend()) {
			return resident;
		}
	}

	return nullptr;
}
Resident* assignWeekend(Resident* argResident)
{
	if (argResident != nullptr) argResident->weekends += 1;
	return assignShift(argResident);
}
Resident* chooseCallSr(Cohort& argAll, vector<Day>& argMonth, const int argDay)
{
	//find weekend 4th year
	Resident* weekendPGY4 = nullptr;
	if (argMonth[argDay + 1].blueSr->PGY == 4) weekendPGY4 = argMonth[argDay + 1].blueSr;
	else if (argMonth[argDay + 1].redSr->PGY == 4) weekendPGY4 = argMonth[argDay + 1].redSr;

	Cohort pool;

	for (Resident* resident : argAll.rList) {
		if (resident->canSrNight() && resident != weekendPGY4) {
			pool.rList.push_back(resident);
		}
	}

	pool.sortByNights();

	for (Resident* resident : pool.rList) {
		if (!argMonth[argDay].isWorking(resident)) return resident;
	}

	return nullptr;
}
Resident* assignCall(Resident* argResident)
{
	argResident->nights += 1;
	return assignWeekend(argResident);
}

void printMonth(vector<Day>& argMonth, string argIndent)
{
	int numWeek = 0;

	for (int day = 0; day < argMonth.size(); day++) {
		if (day % 7 == 0) {
			numWeek += 1;
			cout << argIndent << "Week #" << numWeek << "\n";
		}
		argMonth[day].print(day, "    " + argIndent);
	}
}
void printNumShifts(Cohort& residents)
{
	int totalShifts = 0;
	int curShifts = -1;

	residents.sortByShifts();

	for (list<Resident*>::iterator itr = residents.rList.begin(); itr != residents.rList.end(); itr++) {
		if (curShifts != (*itr)->shifts) {
			curShifts = (*itr)->shifts;
			cout << "\n" << curShifts << " shifts: ";
		}
		cout << (*itr)->name << ", ";
		totalShifts += curShifts;
	}

	cout << "\ntotal shifts = " << totalShifts << "\n";
}

string outputName(Resident* argResident) {

	if (argResident != nullptr) return argResident->name;
	else return "NULL";
}
void outputMonth(vector<Day>& argMonth, string argFileName)
{
	ofstream file;
	file.open(argFileName);

	for (int week = 0; week < argMonth.size() / 7; week++) {

		file << "\t\tMonday\tTuesday\tWednesday\tThursday\tFriday\tSaturday\tSunday\n";
		
		file << "blue\tchief";
		for (int day = week * 7; day < week * 7 + 7; day++) {
			file << "\t";
			if (day % 7 != 5 && day % 7 != 6) file << outputName(argMonth[day].blue5);
		}
		file << "\n";

		file << "\tSr";
		for (int day = week * 7; day < week * 7 + 7; day++) {
			file << "\t" << outputName(argMonth[day].blueSr);
		}
		file << "\n";

		file << "\tJr";
		for (int day = week * 7; day < week * 7 + 7; day++) {
			file << "\t" << outputName(argMonth[day].blueJr);
		}
		file << "\n";

		file << "red\tchief";
		for (int day = week * 7; day < week * 7 + 7; day++) {
			file << "\t";
			if (day % 7 != 5 && day % 7 != 6) file << outputName(argMonth[day].red5);
		}
		file << "\n";

		file << "\tSr";
		for (int i = week * 7; i < week * 7 + 7; i++) {
			file << "\t" << outputName(argMonth[i].redSr);
		}
		file << "\n";

		file << "\tJr";
		for (int i = week * 7; i < week * 7 + 7; i++) {
			file << "\t" << outputName(argMonth[i].redJr);
		}
		file << "\n";

		file << "\tconsult";
		for (int i = week * 7; i < week * 7 + 7; i++) {
			file << "\t" << outputName(argMonth[i].consult);
		}
		file << "\n";

		file << "\tcallSr";
		for (int day = week * 7; day < week * 7 + 7; day++) {
			file << "\t";
			if (day % 7 == 4 || day % 7 == 5) file << outputName(argMonth[day].callSr);
		}
		file << "\n";

		file << "\tcallJr";
		for (int day = week * 7; day < week * 7 + 7; day++) {
			file << "\t";
			if (day % 7 == 4 || day % 7 == 5) file << outputName(argMonth[day].callJr);
		}
		file << "\n\n";
	}

	file.close();

	return;
}
