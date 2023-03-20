import logging



from smart_contracts.helloworld import app as helloworld_app

logger = logging.getLogger(__name__)

# define contracts to build and/or deploy
contracts = [helloworld_app]


