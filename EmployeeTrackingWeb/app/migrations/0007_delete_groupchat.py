
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0006_groupchat'),
    ]

    operations = [
        migrations.DeleteModel(
            name='GroupChat',
        ),
    ]
