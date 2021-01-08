# Clinic Management System

This is a App to Manage Appointments in a Clinic. <br>
[Click to View Demo](https://care.galaxieon.com)

## Clone My Repo <br>

```
git clone https://github.com/muhammadsemeer/clinic-management-system
```

After Cloning, Go to the directory by typing the command shown below.

```
cd clinic-management-system
```

Then, Install Pacakes using

```
npm install
```

Then create `.env` file on root directory and filled up all env vairables as shown as `.env.example` file on root directory.

Then, Run the development Server using

```
npm run dev
```

It will start the dev server that running on port 3001. <br>

Open Your Browser and go to localhost:3001 to open app. <br>

This app have 3 sections. <br>

```
1. User Panel
2. Doctor Panel
3. Admin Panel
```

All Pages on User Section is on `/` route. Doctor Panel And Admin Panel is serving on sudomains like `doctor.example.com` and ```admin.example.com```

If You Want to accces Doctor Panel And Admin Panel you want to add your local subdomain configurations.

On Linux and OSX , add your subdomain to 
```
/etc/hosts
````
```
127.0.0.1       myapp.dev
127.0.0.1       doctor.care.myapp.local
127.0.0.1       admin.care.myapp.local
```
You may not have write permissions on your hosts file, in which case you can grant them:
```
sudo chmod a+rw /etc/hosts
```
### Windows

On Windows 7 and 8, the hosts file path is

```
%systemroot%\system32\drivers\etc.
```
### See https://www.npmjs.com/package/express-subdomain for more details

After setting sudomains got to
```
doctor.care.myapp.local:3001
```
for enter doctor panel and

```
admin.care.myapp.local:3001
```
for enter on admin panel.

### Thank You :heart:
### Have a Nice Day :heart:

