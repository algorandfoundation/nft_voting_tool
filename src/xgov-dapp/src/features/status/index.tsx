import { CheckCircleIcon } from '@heroicons/react/24/solid'
import LaunchIcon from '@mui/icons-material/Launch'
import { Box, Button, Link as MuiLink, Typography } from '@mui/material'
import { Link } from 'react-router-dom'

import { YouDidNotVoteChip, YouVotedChip } from '../../shared/Chips'

function Status() {
  return (
    <div>
      <div className="mb-4">
        <Link to="/" className="no-underline text-gray-600 hover:underline">
          <Typography>&#60; Back to Voting sessions</Typography>
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="col-span-1 sm:col-span-2">
          <Typography variant="h3">Your xGov stats</Typography>
        </div>
        <Box className="bg-white flex rounded-xl px-4 py-2 mr-4 w-fit items-center ml-auto">
          <MuiLink className="no-underline hover:underline" href="https://google.com" target="_blank">
            xGov information portal
            <LaunchIcon className="ml-2 text-grey-light align-bottom" />
          </MuiLink>
        </Box>
        <Box className="bg-green-light flex rounded-xl px-4 py-6">
          <div>
            <CheckCircleIcon className="h-7 w-7 mr-3 -mt-1 text-green" />
          </div>
          <div className="w-full">
            <Typography className="mb-3">
              <strong>You're an elegible xgov</strong>
            </Typography>
            <Typography>Remember to continue voting to maintain your xGov eligibility.</Typography>
          </div>
        </Box>
        <Box className="bg-white flex rounded-xl px-4 py-6">
          <div className="w-full">
            <Typography className="mb-3">
              <strong>Your xGov deposit</strong>
            </Typography>
            <Typography variant="h3">1,972,827,023 mALGO</Typography>
          </div>
        </Box>
        <Box className="bg-white flex rounded-xl px-4 py-6">
          <div className="w-full">
            <Typography className="mb-3">
              <strong>Total earnings from xGov participation</strong>
            </Typography>
            <Typography variant="h3">103 ALGO</Typography>
          </div>
        </Box>
        <div className="col-span-1 sm:col-span-2">
          <div>
            <Typography variant="h4">Voting sessions</Typography>
          </div>
          <div className="table w-full">
            <div className="table-row">
              <div className="table-cell pl-4">
                <strong>Session</strong>
              </div>
              <div className="table-cell">
                <strong>Voting Status</strong>
              </div>
              <div className="table-cell">
                <strong>Duration</strong>
              </div>
              <div className="table-cell">
                <strong>Terms</strong>
              </div>
              <div className="table-cell">
                <strong>Actions</strong>
              </div>
            </div>

            <div className="table-row">
              <div className="table-cell pb-2">
                <div className="bg-yellow-light py-4 rounded-l-lg pl-4">Voting Session 12</div>
              </div>
              <div className="table-cell">
                <div className="bg-yellow-light py-4">
                  <YouDidNotVoteChip />
                </div>
              </div>
              <div className="table-cell">
                <div className="bg-yellow-light py-4">DD-MM-YYYY - DD-MM-YYYY</div>
              </div>
              <div className="table-cell">
                <div className="bg-yellow-light py-4">Terms X, X, X, X</div>
              </div>
              <div className="table-cell">
                <div className="bg-yellow-light pt-2.5 pb-2 rounded-r-lg">
                  <Button color="primary" variant="contained" className="text-right">
                    Submit
                  </Button>
                </div>
              </div>
            </div>

            <div className="table-row">
              <div className="table-cell pb-2">
                <div className="bg-green-light py-4 rounded-l-lg pl-4">Voting Session 11</div>
              </div>
              <div className="table-cell">
                <div className="bg-green-light py-4">
                  <YouVotedChip isSmall={true} isWhite={true} />
                </div>
              </div>
              <div className="table-cell">
                <div className="bg-green-light py-4">DD-MM-YYYY - DD-MM-YYYY</div>
              </div>
              <div className="table-cell">
                <div className="bg-green-light py-4">Terms X, X, X, X</div>
              </div>
              <div className="table-cell">
                <div className="bg-green-light py-4 rounded-r-lg">
                  <Link to="/">View session results</Link>
                </div>
              </div>
            </div>

            <div className="table-row">
              <div className="table-cell pb-2">
                <div className="bg-green-light py-4 rounded-l-lg pl-4">Voting Session 10</div>
              </div>
              <div className="table-cell">
                <div className="bg-green-light py-4">
                  <YouVotedChip isSmall={true} isWhite={true} />
                </div>
              </div>
              <div className="table-cell">
                <div className="bg-green-light py-4">DD-MM-YYYY - DD-MM-YYYY</div>
              </div>
              <div className="table-cell">
                <div className="bg-green-light py-4">Terms X, X, X, X</div>
              </div>
              <div className="table-cell">
                <div className="bg-green-light py-4 rounded-r-lg">
                  <Link to="/">View session results</Link>
                </div>
              </div>
            </div>

            <div className="table-row">
              <div className="table-cell pb-2">
                <div className="bg-green-light py-4 rounded-l-lg pl-4">Voting Session 9</div>
              </div>
              <div className="table-cell">
                <div className="bg-green-light py-4">
                  <YouVotedChip isSmall={true} isWhite={true} />
                </div>
              </div>
              <div className="table-cell">
                <div className="bg-green-light py-4">DD-MM-YYYY - DD-MM-YYYY</div>
              </div>
              <div className="table-cell">
                <div className="bg-green-light py-4">Terms X, X, X, X</div>
              </div>
              <div className="table-cell">
                <div className="bg-green-light py-4 rounded-r-lg">
                  <Link to="/">View session results</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-1 sm:col-span-2 mt-4">
            <div>
              <Typography variant="h4">Term Pools</Typography>
            </div>
            <div className="table w-full">
              <div className="table-row">
                <div className="table-cell pl-4">
                  <strong>Term</strong>
                </div>
                <div className="table-cell">
                  <strong>Total Pool</strong>
                </div>
                <div className="table-cell">
                  <strong>Your deposit</strong>
                </div>
                <div className="table-cell">
                  <strong>Duration</strong>
                </div>
                <div className="table-cell">
                  <strong>Earnings / Losses</strong>
                </div>
              </div>

              <div className="table-row">
                <div className="table-cell pb-2">
                  <div className="bg-white py-4 rounded-l-lg pl-4">Term Pool 24</div>
                </div>
                <div className="table-cell">
                  <div className="bg-white py-4">8,543,856,121 mALGO</div>
                </div>
                <div className="table-cell">
                  <div className="bg-white py-4">2,972,827,023 mALGO</div>
                </div>
                <div className="table-cell">
                  <div className="bg-white py-4">DD-MM-YYYY - DD-MM-YYYY</div>
                </div>
                <div className="table-cell">
                  <div className="bg-white py-4 rounded-r-lg">TBD</div>
                </div>
              </div>

              <div className="table-row">
                <div className="table-cell pb-2">
                  <div className="bg-white py-4 rounded-l-lg pl-4">Term Pool 23</div>
                </div>
                <div className="table-cell">
                  <div className="bg-white py-4">2,443,856,121 mALGO</div>
                </div>
                <div className="table-cell">
                  <div className="bg-white py-4">3,452,827,023 mALGO</div>
                </div>
                <div className="table-cell">
                  <div className="bg-white py-4">DD-MM-YYYY - DD-MM-YYYY</div>
                </div>
                <div className="table-cell">
                  <div className="bg-white text-green py-4 rounded-r-lg">+1 ALGO</div>
                </div>
              </div>

              <div className="table-row">
                <div className="table-cell pb-2">
                  <div className="bg-white py-4 rounded-l-lg pl-4">Term Pool 22</div>
                </div>
                <div className="table-cell">
                  <div className="bg-white py-4">4,653,856,121 mALGO</div>
                </div>
                <div className="table-cell">
                  <div className="bg-white py-4">1,672,827,023 mALGO</div>
                </div>
                <div className="table-cell">
                  <div className="bg-white py-4">DD-MM-YYYY - DD-MM-YYYY</div>
                </div>
                <div className="table-cell">
                  <div className="bg-white text-green py-4 rounded-r-lg">+1 ALGO</div>
                </div>
              </div>

              <div className="table-row">
                <div className="table-cell pb-2">
                  <div className="bg-white py-4 rounded-l-lg pl-4">Term Pool 21</div>
                </div>
                <div className="table-cell">
                  <div className="bg-white py-4">5,643,856,121 mALGO</div>
                </div>
                <div className="table-cell">
                  <div className="bg-white py-4">1,972,827,023 mALGO</div>
                </div>
                <div className="table-cell">
                  <div className="bg-white py-4">DD-MM-YYYY - DD-MM-YYYY</div>
                </div>
                <div className="table-cell">
                  <div className="bg-white text-green py-4 rounded-r-lg">+1 ALGO</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <Box className="bg-white flex rounded-xl px-4 py-6">
            <div className="w-full">
              <Typography className="mb-3">
                <strong>Maintaining your xGov eligilbility</strong>
              </Typography>
              <Typography>
                In order to maintain your status as an xGov, there are a number of requirements you must adhere to. These include...
              </Typography>
              <Typography>
                <br />
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
                proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </Typography>
              <Typography>
                <br />
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
                dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
                proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
              </Typography>
            </div>
          </Box>
        </div>
      </div>
    </div>
  )
}

export default Status
