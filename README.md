## Create the first administrator account

The application does not provide public user registration.

Create the first administrator using Django:

```bash
cd backend
python manage.py migrate
python manage.py createsuperuser