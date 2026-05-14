# Student Attendance System

## Run The Project

Open two terminals.

Terminal 1 - backend:

```powershell
cd C:\Users\pasha\OneDrive\Desktop\project\student-attendance-system\backend
npm.cmd run dev
```

Terminal 2 - frontend:

```powershell
cd C:\Users\pasha\OneDrive\Desktop\project\student-attendance-system\frontend
npm.cmd run dev
```

Then open the frontend URL shown in the terminal, usually:

```text
http://localhost:5173
```

Alternative from the project root:

```powershell
cd C:\Users\pasha\OneDrive\Desktop\project\student-attendance-system
npm.cmd run dev
```

## Demo Login Accounts

All seeded demo accounts use the same password:

```text
12345678
```

### Main Admin

```text
admin1@dsu.com
admin2@srm.com
```

### College Admin

```text
admin.dsu@dsu.com
admin.srm@srm.com
```

### Faculty

Faculty emails follow this pattern:

```text
faculty.<department><number>@<college>.com
```

Departments:

```text
aids, cse, aiml, ece, civil, mech, eee, it
```

Faculty numbers:

```text
1 to 10
```

Colleges:

```text
dsu
srm
```

Examples:

```text
faculty.cse1@dsu.com
faculty.cse10@dsu.com
faculty.aids1@srm.com
faculty.ece5@srm.com
faculty.it10@dsu.com
```

### Students

Student emails follow this pattern:

```text
student.<department><section><number>@<college>.com
```

Departments:

```text
aids, cse, aiml, ece, civil, mech, eee, it
```

Sections:

```text
a, b, c
```

Student numbers:

```text
1 to 16
```

Colleges:

```text
dsu
srm
```

Examples:

```text
student.csea1@dsu.com
student.cseb16@dsu.com
student.aidsa1@srm.com
student.ecec8@srm.com
student.itc16@dsu.com
```

### Quick Test Set

Use these accounts to test the full login flow quickly:

```text
Main Admin:    admin1@dsu.com
College Admin: admin.dsu@dsu.com
Faculty:       faculty.cse1@dsu.com
Student:       student.csea1@dsu.com
Password:      12345678
```
