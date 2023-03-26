import logging


from smart_contracts.voting import app as voting_app

logger = logging.getLogger(__name__)

# define contracts to build and/or deploy
contracts = [voting_app]
