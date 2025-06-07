
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0004_auto_20220314_1634'),
    ]

    operations = [
        migrations.DeleteModel(
            name='GroupChat',
        ),
    ]
